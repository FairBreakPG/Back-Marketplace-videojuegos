import pg from 'pg';
import bcrypt from 'bcryptjs';  
import 'dotenv/config';
import logger from './loggers.js';


const { Pool } = pg;
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

const pool = new Pool({
  host: DB_HOST, 
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
});


export const login = async (email, contraseña) => {
  const query = `SELECT id, nombre, apellido, email, contraseña, rol FROM usuarios WHERE email = $1 AND estado = '1'`;
  const result = await pool.query(query, [email]);

  if (result.rows.length === 0) {
    throw new Error('Credenciales inválidas');
  }

  const usuario = result.rows[0];

  const esValida = await bcrypt.compare(contraseña, usuario.contraseña);

  if (!esValida) {
    throw new Error('Credenciales inválidas');
  }

  return usuario; 
};

export const registrarUsuario = async (nombre, apellido, email, contraseña, telefono, direccion, rol) => {
  logger.info(`Registrando usuario: nombre=${nombre}, apellido=${apellido}, email=${email}, telefono=${telefono}, direccion=${direccion}, rol=${rol}`);

  if (!nombre || !apellido || !email || !contraseña || !telefono || !direccion || !rol) {
    logger.error('Faltan datos requeridos para registrar al usuario');
    throw new Error('Faltan datos para registrar al usuario');
  }

  const hashedPassword = await bcrypt.hash(contraseña, 10); 

  const query = `
    INSERT INTO usuarios (nombre, apellido, email, contraseña, telefono, direccion, rol, estado)
    VALUES ($1, $2, $3, $4, $5, $6, $7, '1') RETURNING id
  `;
  
  try {
    const result = await pool.query(query, [nombre, apellido, email, hashedPassword, telefono, direccion, rol]);
    return result.rows[0].id;  
  } catch (error) {
    logger.error(`Error en la consulta SQL: ${error.message}`);
    throw error;  // Propagar el error hacia el controlador
  }
};

export const obtenerUsuarios = async () => {
  const query = 'SELECT id, nombre, apellido, email, telefono, direccion, rol FROM usuarios WHERE estado = \'1\'';
  const result = await pool.query(query);
  return result.rows;
};

export const obtenerPerfilUsuario = async (id) => {
  const query = 'SELECT id, nombre, apellido, email, telefono, direccion, rol FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const obtenerCarro = async (userId) => {
  const query = `
    SELECT c.id, c.cantidad, p.nombre AS name, p.precio AS price, p.imagen AS img 
    FROM carrito c
    JOIN productos p ON c.producto_id = p.id
    WHERE c.usuario_id = $1
  `;
  const { rows } = await pool.query(query, [userId]);
  const total = rows.reduce((sum, item) => sum + item.price * item.cantidad, 0);
  return { items: rows, total };
};

export const agregarProductoCarro = async (userId, productoId, cantidad) => {
  logger.info(`Intentando agregar producto al carrito: usuario_id=${userId}, producto_id=${productoId}, cantidad=${cantidad}`);

  const query = `
  INSERT INTO carrito (usuario_id, producto_id, cantidad)
  VALUES ($1, $2, $3)
  ON CONFLICT (usuario_id, producto_id) 
  DO UPDATE SET cantidad = carrito.cantidad + EXCLUDED.cantidad
  RETURNING *;
  `;

  try {
    const { rows } = await pool.query(query, [userId, productoId, cantidad]);
    logger.info(`Producto agregado al carrito exitosamente: ${JSON.stringify(rows[0])}`);
    return rows[0];
  } catch (error) {
    logger.error(`Error al agregar producto al carrito: ${error.message}`);
    throw new Error(error.message || "Error al agregar producto al carrito");
  }
};

export const eliminarProductoCarro = async (userId, productoId) => {
  const checkQuery = `
    SELECT * FROM carrito 
    WHERE usuario_id = $1 AND producto_id = $2
  `;
  const { rows } = await pool.query(checkQuery, [userId, productoId]);

  if (rows.length === 0) {
    throw new Error('No se encontró el producto en el carrito o ya fue eliminado.');
  }

  const deleteQuery = `
    DELETE FROM carrito 
    WHERE usuario_id = $1 AND producto_id = $2
    RETURNING id
  `;
  const deleteResult = await pool.query(deleteQuery, [userId, productoId]);

  if (!deleteResult.rows[0]) {
    throw new Error('Error al eliminar el producto del carrito.');
  }

  return deleteResult.rows[0];
};




export const obtenerOrdenes = async () => {
  const query = `
    SELECT p.id, p.total, p.fecha, p.estado, u.nombre AS cliente
    FROM pedidos p
    JOIN usuarios u ON p.usuario_id = u.id
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const obtenerOrdenesHistorial = async (userId) => {
  const query = `
    SELECT p.id, p.total, p.estado, p.fecha, p.metodo_pago
    FROM pedidos p
    WHERE p.usuario_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const crearOrden = async (userId, items, total, metodoPago) => {
  const query = `
    INSERT INTO pedidos (usuario_id, total, metodo_pago)
    VALUES ($1, $2, $3) RETURNING id
  `;
  const result = await pool.query(query, [userId, total, metodoPago]);
  const orderId = result.rows[0].id;

  for (let item of items) {
    const queryDetalle = `
      INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(queryDetalle, [orderId, item.producto_id, item.cantidad, item.precio]);
  }

  return { orderId, total, metodoPago };
};

export const actualizarOrden = async (orderId, estado) => {
  const query = 'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *';
  const result = await pool.query(query, [estado, orderId]);
  return result.rows[0];
};

export const eliminarOrden = async (orderId) => {
  const query = 'DELETE FROM pedidos WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [orderId]);
  return result.rows[0];
};

export const obtenerProductos = async () => {
  const query = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.descuento, p.stock, p.imagen, p.fecha_creacion, p.fecha_modificacion, j.nombre AS juego
    FROM productos p
    LEFT JOIN juegos j ON p.juegos_id = j.id
  `;

  logger.info('Obteniendo lista de productos disponibles');
  
  try {
    const result = await pool.query(query);
    logger.info('Productos obtenidos exitosamente');
    return result.rows;
  } catch (error) {
    logger.error(`Error al obtener productos: ${error.message}`);
    throw error;
  }
};

export const crearProducto = async (nombre, descripcion, precio, descuento, stock, juegosId, imagen) => {
  const query = `
    INSERT INTO productos (nombre, descripcion, precio, descuento, stock, juegos_id, imagen)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
  `;
  const result = await pool.query(query, [nombre, descripcion, precio, descuento, stock, juegosId, imagen]);
  return result.rows[0].id;
};

export const obtenerPerfilUsuarioConPedidos = async (id) => {
  const queryPerfil = `
    SELECT id, nombre, apellido, email, telefono, direccion, rol 
    FROM usuarios 
    WHERE id = $1 AND estado = '1'
  `;
  
  const queryPedidos = `
    SELECT p.id AS pedido_id, p.fecha, p.total, p.estado, p.metodo_pago, 
           dp.producto_id, dp.cantidad, dp.precio
    FROM pedidos p
    LEFT JOIN detalles_pedido dp ON dp.pedido_id = p.id
    WHERE p.usuario_id = $1
  `;
  
  const client = await pool.connect();
  try {
    const perfilResult = await client.query(queryPerfil, [id]);
    const perfil = perfilResult.rows[0];

    if (!perfil) {
      return null;
    }

    let pedidos = [];
    if (perfil.rol === 'cliente') {
      const pedidosResult = await client.query(queryPedidos, [id]);
      pedidos = pedidosResult.rows;
    }

    return { perfil, pedidos };
  } finally {
    client.release();
  }
};







// Obtener productos del carrito
export const obtenerCarritoPorUsuario = async (usuarioId) => {
  const query = `
    SELECT producto_id, cantidad 
    FROM carrito 
    WHERE usuario_id = $1
  `;
  const result = await pool.query(query, [usuarioId]);
  return result.rows;
};

// Limpiar el carrito
export const limpiarCarrito = async (usuarioId) => {
  const query = `
    DELETE FROM carrito 
    WHERE usuario_id = $1
  `;
  await pool.query(query, [usuarioId]);
};
