import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// LISTA: usa LATERAL para tomar el último estado con su fecha
router.get('/', requireAuth(['TRANSPORTISTA','ADMIN','AGENTE']), async (req, res) => {
  try {
    const q = `
      SELECT
        d.numero_documento,
        COALESCE(le.estado, '—') AS estado,
        le.creado_en AS creado
      FROM duca d
      LEFT JOIN LATERAL (
        SELECT e.estado, e.creado_en
        FROM estados e
        WHERE e.numero_documento = d.numero_documento
        ORDER BY e.creado_en DESC
        LIMIT 1
      ) le ON TRUE
      ORDER BY d.numero_documento DESC
    `
    const r = await pool.query(q)
    // Devuelve 'creado' listo para el front
    return res.json(r.rows)
  } catch (e) {
    console.error('GET /estados error:', e)
    return res.status(500).json({ error: 'Error interno en /estados' })
  }
})

// DETALLE (si no lo tienes ya)
router.get('/:numero', requireAuth(['TRANSPORTISTA','ADMIN','AGENTE']), async (req, res) => {
  const numero = req.params.numero
  try {
    const hq = `
      SELECT e.estado, e.motivo, e.creado_en, COALESCE(u.correo, '') AS usuario
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
    return res.json({
      numero,
      estado: historial.rows.at(-1)?.estado ?? 'DESCONOCIDO',
      historial: historial.rows,
      duca: duca.rows?.[0] ?? null,
    })
  } catch (e) {
    console.error('GET /estados/:numero error:', e)
    return res.status(500).json({ error: 'Error interno en /estados/:numero' })
  }
})

export default router
