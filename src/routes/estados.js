// src/routes/estados.js
import { Router } from 'express';
import { pool } from '../db.js'; // conexión pg
import { requireAuth } from '../middleware/auth.js'; // validación JWT

const router = Router();

// =============================================================
// 🔹 Obtener lista de declaraciones del transportista autenticado
// =============================================================
router.get('/', requireAuth(['TRANSPORTISTA', 'ADMIN', 'AGENTE']), async (req, res) => {
  try {
    const u = req.user;
    const result = await pool.query(
      `SELECT numero_documento, estado_documento, creado_en
         FROM duca
        WHERE transportista_id = $1
        ORDER BY creado_en DESC`,
      [u.sub]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error /estados:', err);
    res.status(500).json({ error: 'Error interno en /estados' });
  }
});

// =============================================================
// 🔹 Detalle de una declaración DUCA (GET /estados/:numero)
// =============================================================
router.get('/:numero', requireAuth(['TRANSPORTISTA', 'ADMIN', 'AGENTE']), async (req, res) => {
  const { numero } = req.params;
  try {
    // 1️⃣ Historial de cambios en la tabla estados
    const historialQuery = `
      SELECT e.estado, e.motivo, e.creado_en, u.correo AS usuario
        FROM estados e
        LEFT JOIN usuarios u ON u.id = e.usuario_id
       WHERE e.numero_documento = $1
       ORDER BY e.creado_en ASC
    `;

    // 2️⃣ Información principal de la DUCA
    const ducaQuery = `
      SELECT numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
             importador, exportador, transporte, mercancias
        FROM duca
       WHERE numero_documento = $1
    `;

    const [historial, duca] = await Promise.all([
      pool.query(historialQuery, [numero]),
      pool.query(ducaQuery, [numero]),
    ]);

    res.json({
      numero,
      estado: historial.rows.at(-1)?.estado || 'DESCONOCIDO',
      historial: historial.rows,
      duca: duca.rows[0] || null,
    });
  } catch (err) {
    console.error('Error /estados/:numero:', err);
    res.status(500).json({ error: 'Error interno en /estados/:numero' });
  }
});

export default router;
