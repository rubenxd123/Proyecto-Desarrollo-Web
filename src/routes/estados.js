// src/routes/estados.js
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// -----------------------------------------------------------------------------
// GET /estados
// Lista "mis declaraciones" mostrando el último estado de cada documento.
// Para TRANSPORTISTA filtra por el usuario autenticado (req.user.sub).
// Para otros roles puedes ampliar el criterio según tu negocio.
// -----------------------------------------------------------------------------
router.get('/', requireAuth(), async (req, res) => {
  const user = req.user // { sub, rol, ... }

  let filtro = ''
  const params = []

  if (user.rol === 'TRANSPORTISTA') {
    filtro = 'WHERE d.transportista_id = $1'
    params.push(user.sub)
  }

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
      JOIN duca d ON d.numero_documento = e.numero_documento
      ${filtro}
    )
    SELECT
      numero_documento,
      estado       AS estado_documento,
      creado_en
    FROM ult
    WHERE rn = 1
    ORDER BY creado_en DESC
    LIMIT 200
  `

  const r = await pool.query(q, params)
  res.json(r.rows)
})

// -----------------------------------------------------------------------------
// GET /estados/:numero
// Devuelve historial completo y la DUCA asociada.
// -----------------------------------------------------------------------------
router.get('/:numero', requireAuth(), async (req, res) => {
  const { numero } = req.params

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
