// src/routes/estados.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /estados
 * Lista de declaraciones con su ÚLTIMO estado.
 * No asume columnas especiales (como transportista_id) ni tabla usuarios.
 * Si una DUCA no tiene estados, se muestra PENDIENTE y se usa fecha_emision como "creado".
 */
router.get('/', requireAuth(['ADMIN', 'AGENTE', 'TRANSPORTISTA']), async (_req, res) => {
  try {
    const q = `
      WITH ult AS (
        SELECT
          e.numero_documento,
          e.estado,
          e.creado_en,
          ROW_NUMBER() OVER (
            PARTITION BY e.numero_documento
            ORDER BY e.creado_en DESC
          ) rn
        FROM estados e
      )
      SELECT
        d.numero_documento,
        COALESCE(u.estado, 'PENDIENTE')    AS estado_documento,
        COALESCE(u.creado_en, d.fecha_emision) AS creado_en
      FROM duca d
      LEFT JOIN ult u
        ON u.numero_documento = d.numero_documento
       AND u.rn = 1
      ORDER BY creado_en DESC NULLS LAST, d.numero_documento ASC
      LIMIT 200;
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err) {
    console.error('❌ Error en GET /estados', err);
    res.status(500).json({ error: 'Error interno en /estados' });
  }
});

/**
 * GET /estados/:numero
 * Devuelve historial completo y la DUCA asociada.
 * No une contra usuarios; devuelve usuario_id tal cual si existe en la tabla estados.
 */
router.get('/:numero', requireAuth(['ADMIN', 'AGENTE', 'TRANSPORTISTA']), async (req, res) => {
  const { numero } = req.params;
  try {
    const hq = `
      SELECT
        e.estado,
        e.motivo,
        e.creado_en,
        e.usuario_id            -- devolvemos el id directo; sin join a usuarios
      FROM estados e
      WHERE e.numero_documento = $1
      ORDER BY e.creado_en ASC;
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
      WHERE numero_documento = $1;
    `;

    const [historial, duca] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero]),
    ]);

    const historialRows = historial.rows ?? [];
    const ducaRow = duca.rows?.[0] ?? null;

    res.json({
      numero,
      estado: historialRows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historialRows,
      duca: ducaRow,
    });
  } catch (err) {
    console.error('❌ Error en GET /estados/:numero', err);
    res.status(500).json({ error: 'Error interno en detalle de estado' });
  }
});

export default router;
