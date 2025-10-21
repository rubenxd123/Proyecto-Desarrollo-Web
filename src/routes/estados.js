// src/routes/estados.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /estados
 * Lista cada DUCA con su último estado (o PENDIENTE si no hay).
 * Sin dependencias de columnas especiales ni join a usuarios.
 * Incluye Fallback: si la consulta falla por cualquier motivo, responde
 * únicamente con la lista de DUCAs y estado PENDIENTE.
 */
router.get('/', requireAuth(['ADMIN', 'AGENTE', 'TRANSPORTISTA']), async (_req, res) => {
  try {
    // Subconsultas por fila: evitan CTE/joins “sensibles”.
    const q = `
      SELECT
        d.numero_documento,
        COALESCE(
          (SELECT e.estado
             FROM estados e
            WHERE e.numero_documento = d.numero_documento
            ORDER BY e.creado_en DESC
            LIMIT 1),
          'PENDIENTE'
        ) AS estado_documento,
        COALESCE(
          (SELECT e.creado_en
             FROM estados e
            WHERE e.numero_documento = d.numero_documento
            ORDER BY e.creado_en DESC
            LIMIT 1),
          d.fecha_emision
        ) AS creado_en
      FROM duca d
      ORDER BY creado_en DESC NULLS LAST, d.numero_documento ASC
      LIMIT 200;
    `;
    const r = await pool.query(q);
    return res.json(r.rows);
  } catch (err) {
    console.error('❌ Error en GET /estados (principal):', err?.message || err);
    // Fallback: devolver solo DUCAs con estado PENDIENTE
    try {
      const q2 = `
        SELECT
          numero_documento,
          'PENDIENTE' AS estado_documento,
          fecha_emision AS creado_en
        FROM duca
        ORDER BY fecha_emision DESC, numero_documento ASC
        LIMIT 200;
      `;
      const r2 = await pool.query(q2);
      return res.json(r2.rows);
    } catch (err2) {
      console.error('❌ Error en GET /estados (fallback):', err2?.message || err2);
      return res.status(500).json({ error: err2?.message || 'Error interno en /estados' });
    }
  }
});

/**
 * GET /estados/:numero
 * Devuelve historial completo y la DUCA asociada.
 * Si falla leer la tabla estados, responde DUCA + historial vacío.
 */
router.get('/:numero', requireAuth(['ADMIN', 'AGENTE', 'TRANSPORTISTA']), async (req, res) => {
  const { numero } = req.params;
  try {
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
      WHERE numero_documento = $1;
    `;

    const hq = `
      SELECT
        e.estado,
        e.motivo,
        e.creado_en,
        e.usuario_id
      FROM estados e
      WHERE e.numero_documento = $1
      ORDER BY e.creado_en ASC;
    `;

    const [duca, historial] = await Promise.all([
      pool.query(dq, [numero]),
      pool.query(hq, [numero]),
    ]);

    const ducaRow = duca.rows?.[0] ?? null;
    const historialRows = historial.rows ?? [];

    return res.json({
      numero,
      estado: historialRows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historialRows,
      duca: ducaRow,
    });
  } catch (err) {
    console.error('❌ Error en GET /estados/:numero (principal):', err?.message || err);

    // Fallback: devolver DUCA y historial vacío
    try {
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
        WHERE numero_documento = $1;
      `;
      const duca = await pool.query(dq, [numero]);
      const ducaRow = duca.rows?.[0] ?? null;

      return res.json({
        numero,
        estado: 'DESCONOCIDO',
        historial: [],
        duca: ducaRow,
      });
    } catch (err2) {
      console.error('❌ Error en GET /estados/:numero (fallback):', err2?.message || err2);
      return res.status(500).json({ error: err2?.message || 'Error interno en detalle de estado' });
    }
  }
});

export default router;
