import pg from 'pg';
import bcrypt from 'bcryptjs';  
import 'dotenv/config';


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
  const hashedPassword = await bcrypt.hash(contraseña, 10); 

  const query = `
    INSERT INTO usuarios (nombre, apellido, email, contraseña, telefono, direccion, rol, estado)
    VALUES ($1, $2, $3, $4, $5, $6, $7, '1') RETURNING id
  `;
  
  const result = await pool.query(query, [nombre, apellido, email, hashedPassword, telefono, direccion, rol]);
  return result.rows[0].id;  
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
    SELECT c.id, p.nombre AS producto, p.precio, p.imagen, c.cantidad 
    FROM carrito c
    JOIN productos p ON c.producto_id = p.id
    WHERE c.usuario_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const quitarItemCarro = async (userId, productoId) => {
  const query = 'DELETE FROM carrito WHERE usuario_id = $1 AND producto_id = $2 RETURNING *';
  const result = await pool.query(query, [userId, productoId]);
  return result.rows[0];
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

// Eliminar una orden
export const eliminarOrden = async (orderId) => {
  const query = 'DELETE FROM pedidos WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [orderId]);
  return result.rows[0];
};
