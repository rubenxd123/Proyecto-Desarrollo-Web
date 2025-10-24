// src/db.js
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render/Heroku suelen requerir SSL
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
});

// ✅ Export nominal `query` para compatibilidad con las rutas
export const query = (text, params) => pool.query(text, params);

// Por si en otros archivos usas pool directamente
export { pool };

// (opcional) default export
export default pool;
