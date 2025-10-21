import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Lista (ya te funciona)
router.get('/', requireAuth(['TRANSPORTISTA', 'ADMIN', 'AGENTE']), async (req, res) => {
  try {
    const u = req.user;
    const r = await pool.query(
      `SELECT numero_documento, estado_documento, creado_en
         FROM duca
        WHERE transportista_id = $1
        ORDER BY creado_en DESC`,
      [u.sub]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('Error /estados:', e);
    res.status(500).json({ error: 'Error interno en /estados' });
  }
});

// Detalle
router.get('/:numero', requireAuth(['TRANSPORTISTA', 'ADMIN', 'AGENTE']), async (req, res) => {
  const { numero } = req.params;
  try {
    const hq = `
      SELECT e.estado, e.motivo, e.creado_en, u.correo AS usuario
        FROM estados e
        LEFT JOIN usuarios u ON u.id = e.usuario_id
       WHERE e.numero_documento = $1
       ORDER BY e.creado_en ASC
    `;
    const dq = `
      SELECT numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
             importador, exportador, transporte, mercancias
        FROM duca
       WHERE numero_documento = $1
    `;

    const [historial, duca] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero]),
    ]);

    res.json({
      numero,
      estado: historial.rows.at(-1)?.estado || 'DESCONOCIDO',
      historial: historial.rows,
      duca: duca.rows[0] || null,
    });
  } catch (e) {
    console.error('Error /estados/:numero:', e);
    res.status(500).json({ error: 'Error interno en /estados/:numero' });
  }
});

export default router;
