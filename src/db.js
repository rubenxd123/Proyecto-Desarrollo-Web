// src/db.js
import pg from "pg";
const { Pool } = pg;

// Render PostgreSQL expone DATABASE_URL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // requerido por Render
});
