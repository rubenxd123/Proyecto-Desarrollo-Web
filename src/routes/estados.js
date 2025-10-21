// src/routes/estados.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth as auth } from '../middleware/auth.js'; // usa tu middleware real

const router = Router();

/**
 * GET /estados
 * Lista para el TRANSPORTISTA los documentos propios (ajusta a tu lógica si hace falta).
 */
router.get('/', auth(), async (req, res) => {
  try {
    const u = req.user; // del middleware
    // Ajusta este SELECT a tu esquema real de relación usuario <-> duca
    const r = await pool.query(
      `SELECT numero_documento, estado_documento, creado_en
       FROM estados
       WHERE usuario_id = $1
       ORDER BY creado_en DESC`,
      [u.sub]
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno en /estados' });
  }
});

/**
 * GET /estados/:numero
 * Devuelve historial + duca (la fila completa con importador/exportador/transporte).
 */
router.get('/:numero', auth(), async (req, res) => {
  const numero = req.params.numero;

  const hq = `
    SELECT e.estado AS estado, e.motivo, e.creado_en, COALESCE(u.correo, '') AS usuario
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
      transporte
    FROM duca
    WHERE numero_documento = $1
  `;

  try {
    const [historial, duca] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero]),
    ]);

    res.json({
      numero,
      estado: historial.rows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historial.rows ?? [],
      duca: duca.rows?.[0] ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno en /estados/:numero' });
  }
});

export default router;
