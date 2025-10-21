import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth(['TRANSPORTISTA','ADMIN','AGENTE']), async (req, res) => {
  try {
    const q = `
      SELECT
        d.numero_documento,
        COALESCE(last_e.estado, 'DESCONOCIDO') AS estado,
        last_e.creado_en AS creado
      FROM duca d
      LEFT JOIN LATERAL (
        SELECT e.estado, e.creado_en
        FROM estados e
        WHERE e.numero_documento = d.numero_documento
        ORDER BY e.creado_en DESC
        LIMIT 1
      ) last_e ON TRUE
      WHERE d.transportista_id = $1
      ORDER BY last_e.creado_en DESC NULLS LAST, d.numero_documento DESC
    `
    const r = await pool.query(q, [req.user.sub])
    res.json(r.rows)
  } catch (e) {
    console.error('GET /estados error:', e)
    res.status(500).json({ error: 'Error interno en /estados' })
  }
})

router.get('/:numero', requireAuth(['TRANSPORTISTA','ADMIN','AGENTE']), async (req, res) => {
  try {
    const numero = req.params.numero

    const hq = `
      SELECT e.estado, e.motivo, e.creado_en, u.correo AS usuario
      FROM estados e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.numero_documento = $1
      ORDER BY e.creado_en ASC
    `
    const dq = `
      SELECT
        numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
        importador, exportador, transporte
      FROM duca
      WHERE numero_documento = $1
    `

    const [historial, duca] = await Promise.all([
      pool.query(hq, [numero]),
      pool.query(dq, [numero]),
    ])

    res.json({
      numero,
      estado: historial.rows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historial.rows,
      duca: duca.rows?.[0] ?? null,
    })
  } catch (e) {
    console.error('GET /estados/:numero error:', e)
    res.status(500).json({ error: 'Error interno en /estados/:numero' })
  }
})

export default router
