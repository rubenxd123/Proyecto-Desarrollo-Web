// src/db.js
import pg from 'pg';

const { Pool } = pg;

// Render/Heroku-style: usa DATABASE_URL y SSL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
});

// Helper opcional por compatibilidad con rutas antiguas
export async function query(text, params) {
  return pool.query(text, params);
}

export default pool;
