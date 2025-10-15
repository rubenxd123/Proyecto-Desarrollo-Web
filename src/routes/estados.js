// src/routes/estados.js
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /estados/:numero → historial + declaración
router.get('/:numero', requireAuth(), async (req, res) => {
  const { numero } = req.params

  // historial de estados
  const hq = `
    SELECT
      e.estado                 AS estado,
      e.motivo                 AS motivo,
      e.creado_en              AS creado_en,
      COALESCE(u.correo, '')   AS usuario
    FROM estados e
    LEFT JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.numero_documento = $1
    ORDER BY e.creado_en ASC
  `

  // declaración DUCA
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
  `

  const [historial, duca] = await Promise.all([
    pool.query(hq, [numero]),
    pool.query(dq, [numero]),
  ])

  const historialRows = historial.rows ?? []
  const ducaRow = duca.rows?.[0] ?? null

  return res.json({
    numero,
    estado: historialRows.at(-1)?.estado ?? 'DESCONOCIDO',
    historial: historialRows,
    duca: ducaRow,
  })
})

export default router
