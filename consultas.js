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
    throw error;  
  }
};

export const obtenerUsuarios = async (userId) => {
  const query = `
    SELECT id, nombre, apellido, email, direccion, telefono, fecha_registro, estado, rol
    FROM usuarios
    WHERE id = $1
  `;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }
  return result.rows[0];
};

export const obtenerPerfilUsuario = async (id) => {
  const query = 'SELECT id, nombre, apellido, email, telefono, direccion, rol FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const actualizarPerfilUsuario = async (id, { nombre, apellido, email, telefono, direccion }) => {
  const query = `
    UPDATE usuarios
    SET 
      nombre = $1, 
      apellido = $2, 
      email = $3, 
      telefono = $4, 
      direccion = $5
    WHERE id = $6
    RETURNING id, nombre, apellido, email, telefono, direccion, rol;
  `;
  const result = await pool.query(query, [nombre, apellido, email, telefono, direccion, id]);
  return result.rows[0];
};

export const obtenerCarro = async (userId) => {
  const query = `
    SELECT 
  c.id AS carrito_id, 
  c.cantidad, 
  p.nombre AS product_name, 
  p.precio AS product_price, 
  p.imagen AS product_image
  FROM carrito c
  JOIN productos p ON c.producto_id = p.id
  JOIN usuarios u ON c.usuario_id = u.id
  WHERE c.usuario_id = $1; 
  `;
  const { rows } = await pool.query(query, [userId]);
  const total = rows.reduce((sum, item) => sum + item.price * item.cantidad, 0);
  return { items: rows, total };
};
/*
 SELECT c.id, c.cantidad, p.nombre AS name, p.precio AS price, p.imagen AS img 
    FROM carrito c
    JOIN productos p ON c.producto_id = p.id
    WHERE c.usuario_id = $1
  `;
*/

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
export const obtenerHistorialPedidos = async (userId) => {
  const query = `
    SELECT p.id AS pedido_id, p.fecha, p.total, p.estado AS estado_pedido, p.metodo_pago, 
           hp.estado AS estado_historial, hp.fecha_cambio
    FROM pedidos p
    LEFT JOIN historial_pedidos hp ON p.id = hp.pedido_id
    WHERE p.usuario_id = $1
    ORDER BY p.fecha DESC
  `;
  const result = await pool.query(query, [userId]);
  if (result.rows.length === 0) {
    throw new Error('No se encontraron pedidos para este usuario');
  }
  return result.rows;
};

export const obtenerProductos = async () => {
  const query = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.descuento, p.stock, p.imagen, p.fecha_creacion, p.fecha_modificacion, c.nombre AS categoria
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
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

export const crearProducto = async (nombre, descripcion, precio, descuento, stock, categoria_id, imagen) => {
  const query = `
    INSERT INTO productos (nombre, descripcion, precio, descuento, stock, categoria_id, imagen)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
  `;
  const result = await pool.query(query, [nombre, descripcion, precio, descuento, stock, categoria_id, imagen]);
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

export const eliminarProductoDelCarrito = async (userId, productoId) => {
  try {
    const query = 'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2 RETURNING *';  
    const result = await pool.query(query, [userId, productoId]);
    if (result.rowCount === 0) {
      throw new Error('No se encontró el producto en el carrito para este usuario');
    }
    return result.rows;  
  } catch (err) {
    console.error('Error al eliminar el producto del carrito para el usuario:', err);
    throw new Error('Error al eliminar el producto del carrito');
  }
};

export const guardarPedido = async (usuario_id, total, metodo_pago, detalles_pedido) => {
  logger.info('Datos recibidos para guardar el pedido:', {
    usuario_id,
    total,
    metodo_pago,
    detalles_pedido
  });
  const client = await pool.connect();

  try {
    // transaccion back
    await client.query('BEGIN');
    logger.info('Iniciando transacción para guardar pedido');
    const resultPedido = await client.query(
      `INSERT INTO pedidos (usuario_id, total, metodo_pago)
       VALUES ($1, $2, $3) RETURNING id`,
      [usuario_id, total, metodo_pago]
    );
    const nuevoPedido = resultPedido.rows[0]; 
    logger.info('Nuevo pedido creado:', nuevoPedido);
    const carritoProductos = await client.query(
      `SELECT c.producto_id, c.cantidad
       FROM carrito c
       WHERE c.usuario_id = $1`,
      [usuario_id]
    );
    if (carritoProductos.rows.length === 0) {
      logger.error('El carrito está vacío para el usuario:', usuario_id);
      throw new Error('No hay productos en el carrito');
    }
    for (const carritoItem of carritoProductos.rows) {
      logger.info('Insertando detalle del pedido:', carritoItem);

      await client.query(
        `INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio)
         VALUES ($1, $2, $3, $4)`,
        [nuevoPedido.id, carritoItem.producto_id, carritoItem.cantidad, total / carritoProductos.rows.length] // El precio unitario calculado
      );
    }
    await client.query(
      `INSERT INTO historial_pedidos (pedido_id, estado)
       VALUES ($1, '0')`, 
      [nuevoPedido.id]
    );
    logger.info('Historial de pedido insertado para el pedido ID:', nuevoPedido.id);
    await client.query('COMMIT');
    logger.info('Transacción completada, pedido guardado con éxito');
    return nuevoPedido; 
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error al guardar el pedido:', error);
    return null;
  } finally {
    client.release(); 
  }
};


//nuevo borrado carrito 
export const eliminarProductoCarro = async (usuarioId, productoId) => {
  const query = 'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2 RETURNING *';
  const result = await pool.query(query, [usuarioId, productoId]);
  return result.rowCount > 0;  
};

export const getPedidosPorUsuario = async (usuarioId) => {
  const query = `
    SELECT 
      p.id AS pedido_id,
      p.fecha AS fecha_pedido,
      p.total,
      p.estado AS estado_pedido,
      p.metodo_pago,
      dp.producto_id,
      pr.nombre AS producto_nombre,
      dp.cantidad,
      dp.precio,
      hp.estado AS historial_estado,
      hp.fecha_cambio
    FROM 
      pedidos p
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      LEFT JOIN historial_pedidos hp ON p.id = hp.pedido_id
    WHERE 
      p.usuario_id = $1  -- Parámetro de usuarioId
    ORDER BY p.fecha DESC;
  `;

  try {
    const result = await pool.query(query, [usuarioId]);
    return result.rows;  
  } catch (err) {
    console.error('Error en la consulta de pedidos por usuario:', err);
    throw new Error('Error al obtener los pedidos por usuario');
  }
};


export const getPedidosTodosUsuarios = async () => {
  const query = `
    SELECT 
      p.id AS pedido_id,
      p.usuario_id,
      u.nombre AS usuario_nombre,
      p.fecha AS fecha_pedido,
      p.total,
      p.estado AS estado_pedido,
      p.metodo_pago,
      dp.producto_id,
      pr.nombre AS producto_nombre,
      dp.cantidad,
      dp.precio,
      hp.estado AS historial_estado,
      hp.fecha_cambio
    FROM 
      pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN detalles_pedido dp ON p.id = dp.pedido_id
      JOIN productos pr ON dp.producto_id = pr.id
      LEFT JOIN historial_pedidos hp ON p.id = hp.pedido_id
    ORDER BY p.fecha DESC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;  
  } catch (err) {
    console.error('Error en la consulta de pedidos de todos los usuarios:', err);
    throw new Error('Error al obtener los pedidos de todos los usuarios');
  }
};
