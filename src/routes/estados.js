import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// LISTA: estados por cada DUCA con alias 'creado' (no 'creado_en')
router.get('/', requireAuth(['TRANSPORTISTA','ADMIN','AGENTE']), async (req, res) => {
  const u = req.user
  try {
    // Si quieres filtrar por transportista, añade WHERE d.transportista_id = $1
    const q = `
      SELECT
        d.numero_documento,
        COALESCE((
          SELECT e.estado
          FROM estados e
          WHERE e.numero_documento = d.numero_documento
          ORDER BY e.creado_en DESC
          LIMIT 1
        ), '—') AS estado,
        (
          SELECT e.creado_en
          FROM estados e
          WHERE e.numero_documento = d.numero_documento
          ORDER BY e.creado_en DESC
          LIMIT 1
        ) AS creado
      FROM duca d
      ORDER BY d.numero_documento DESC
    `
    const r = await pool.query(q)
    // ⚠️ Cambiamos la propiedad a 'creado' para que matchee con el front
    const items = r.rows.map(x => ({
      numero_documento: x.numero_documento,
      estado: x.estado,
      creado: x.creado // <-- alias correcto para el front
    }))
    res.json(items)
  } catch (e) {
    console.error('GET /estados error:', e)
    res.status(500).json({ error: 'Error interno en /estados' })
  }
})

export default router
