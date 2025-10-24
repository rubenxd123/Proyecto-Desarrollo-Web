// src/db.js
import pg from "pg";
const { Pool } = pg;

// Conexión a PostgreSQL (Render)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Requerido en Render
});
