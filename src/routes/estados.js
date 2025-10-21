// src/routes/estados.js
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * GET /estados/:numero
 * Devuelve:
 *  - historial (estados con quién/cuándo)
 *  - duca (incluye importador, exportador, transporte, mercancias)
 */
router.get('/:numero', requireAuth(), async (req, res) => {
  try {
    const { numero } = req.params

    const hq = `
      SELECT
        e.estado,
        e.motivo,
        e.creado_en,
        COALESCE(u.correo, '') AS usuario
      FROM estados e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.numero_documento = $1
      ORDER BY e.creado_en ASC;
    `

    const dq = `
      SELECT
        numero_documento,
        fecha_emision,
        pais_emisor,
        moneda,
        valor_aduana_total,
        importador,       -- jsonb
        exportador,       -- jsonb
        transporte,       -- jsonb
        mercancias        -- jsonb
      FROM duca
      WHERE numero_documento = $1;
    `

    const [hRes, dRes] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero])
    ])

    const historial = hRes.rows ?? []
    const duca = dRes.rows?.[0] ?? null

    return res.json({
      numero,
      estado: historial.at(-1)?.estado ?? 'DESCONOCIDO',
      historial,
      duca
    })
  } catch (e) {
    console.error('[GET /estados/:numero] error:', e)
    return res.status(500).json({ error: 'Error interno en /estados/:numero' })
  }
})

export default router
