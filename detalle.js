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

//query a bd

