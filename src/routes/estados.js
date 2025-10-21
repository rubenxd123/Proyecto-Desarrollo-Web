import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ...tu GET '/' existente

// GET /estados/:numero  → historial + declaración DUCA
router.get('/:numero', requireAuth(['TRANSPORTISTA', 'ADMIN', 'AGENTE']), async (req, res) => {
  const { numero } = req.params;
  try {
    // 👇 OJO: todo dentro del MISMO template string
    const hq = `
      SELECT
        e.estado       AS estado,
        e.motivo       AS motivo,
        e.creado_en    AS creado_en,
        COALESCE(u.correo, '') AS usuario
      FROM estados e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.numero_documento = $1
      ORDER BY e.creado_en ASC
    `;

    const dq = `
      SELECT
        numero_documento,
        fecha_emision,
        pais_emisor,
        moneda,
        valor_aduana_total,
        importador,
        exportador,
        transporte,
        mercancias
      FROM duca
      WHERE numero_documento = $1
    `;

    const [historial, duca] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero]),
    ]);

    return res.json({
      numero,
      estado: historial.rows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historial.rows,
      duca: duca.rows?.[0] ?? null,
    });
  } catch (e) {
    console.error('Error /estados/:numero:', e);
    res.status(500).json({ error: e.message || 'Error interno en /estados/:numero' });
  }
});

export default router;
