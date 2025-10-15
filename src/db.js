// src/db.js
import pg from 'pg'
const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// (opcional, por si te gusta usar query directamente)
export const query = (text, params) => pool.query(text, params)
