import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '1234',
  database: 'likeme',
  port: 5432,
});

export const obtenerPost = async () => {
  const { rows } = await pool.query("SELECT * FROM posts;");
  return rows; 
};

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