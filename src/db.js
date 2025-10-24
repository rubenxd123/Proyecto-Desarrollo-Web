// src/db.js
import pkg from "pg";
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

// Si no hay DATABASE_URL, no rompas el arranque; crea un modo "dummy"
let pool = null;
if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // necesario en Render Postgres
  });
}

export const query = async (text, params) => {
  if (!pool) throw new Error("DATABASE_URL not configured");
  return pool.query(text, params);
};

export const dbHealth = async () => {
  try {
    if (!pool) return { ok: false, message: "DATABASE_URL not configured" };
    const r = await pool.query("SELECT now() as now");
    return { ok: true, now: r.rows?.[0]?.now };
  } catch (e) {
    return { ok: false, message: e.message };
  }
};
