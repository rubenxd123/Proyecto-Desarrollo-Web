// src/routes/estados.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ============================================================
// 🔹 Obtener todos los estados del transportista logueado
// ============================================================
router.get('/', requireAuth(['TRANSPORTISTA', 'ADMIN']), async (req, res) => {
  try {
    const u = req.user;
    const query = `
      SELECT d.numero_documento, e.estado, e.creado_en
      FROM duca d
      LEFT JOIN estados e ON e.numero_documento = d.numero_documento
      WHERE d.transportista_id = $1
      ORDER BY e.creado_en DESC NULLS LAST, d.numero_documento ASC
    `;
    const result = await pool.query(query, [u.sub]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error en GET /estados', err);
    res.status(500).json({ error: 'Error interno en /estados' });
  }
});

// ============================================================
// 🔹 Obtener detalle de un documento
// ============================================================
router.get('/:numero', requireAuth(['TRANSPORTISTA', 'ADMIN', 'AGENTE']), async (req, res) => {
  const { numero } = req.params;
  try {
    // Historial de cambios
    const hq = `
      SELECT e.estado, e.motivo, e.creado_en, u.correo AS usuario
      FROM estados e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.numero_documento = $1
      ORDER BY e.creado_en ASC
    `;

    // Datos de la DUCA
    const dq = `
      SELECT numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
             importador, exportador, transporte, mercancias
      FROM duca
      WHERE numero_documento = $1
    `;

    const [historial, duca] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero])
    ]);

    const historialRows = historial.rows ?? [];
    const ducaRow = duca.rows?.[0] ?? null;

    res.json({
      numero,
      estado: historialRows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historialRows,
      duca: ducaRow
    });
  } catch (err) {
    console.error('❌ Error en GET /estados/:numero', err);
    res.status(500).json({ error: 'Error interno en detalle de estado' });
  }
});

export default router;
