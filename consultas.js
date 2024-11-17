import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, JWT_SECRET } = process.env;

const pool = new Pool({
  host: 'DB_HOST',
  user: 'DB_USER',
  password: 'DB_PASSWORD',
  database: 'DB_DATABASE',
  port: 'DB_PORT',
});

export const obtenerPost = async () => {
  const { rows } = await pool.query("SELECT * FROM posts;");
  return rows; 
};

export const JWT_SECRETA = JWT_SECRET;

//aqui las consultas

const conexionTest = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Conectado a la base de datos desde config');
  } catch (error) {
    console.log('Error en la conexion a la base de datos desde config', error.message);
  }
};

conexionTest();