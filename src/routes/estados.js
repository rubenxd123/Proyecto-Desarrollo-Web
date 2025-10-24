import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth(), async (_req, res) => {
  try {
    const q = `
      SELECT d.numero_documento,
             COALESCE((
               SELECT e.estado
               FROM estados e
               WHERE e.numero_documento = d.numero_documento
               ORDER BY e.creado_en DESC
               LIMIT 1
             ), '—') AS estado,
             COALESCE((
               SELECT MIN(e.creado_en)
               FROM estados e
               WHERE e.numero_documento = d.numero_documento
             ), NULL) AS creado
      FROM duca d
      ORDER BY d.numero_documento DESC
    `
    const r = await pool.query(q)
    res.json(r.rows)
  } catch (e) {
    console.error('GET /estados error:', e)
    res.status(500).json({ error: 'Error interno en /estados' })
  }
})

router.get('/:numero', requireAuth(), async (req, res) => {
  try {
    const { numero } = req.params

    const [h, d] = await Promise.all([
      pool.query(`
        SELECT e.estado, e.motivo, e.creado_en, COALESCE(u.correo,'') AS usuario
        FROM estados e
        LEFT JOIN usuarios u ON u.id = e.usuario_id
        WHERE e.numero_documento = $1
        ORDER BY e.creado_en ASC`, [numero]),
      pool.query(`
        SELECT numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
               importador, exportador, transporte
        FROM duca
        WHERE numero_documento = $1`, [numero])
    ])

    res.json({
      numero,
      estado: h.rows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: h.rows,
      duca: d.rows[0] ?? null,
    })
  } catch (e) {
    console.error('GET /estados/:numero error:', e)
    res.status(500).json({ error: 'Error interno en /estados/:numero' })
  }
})

export default router
