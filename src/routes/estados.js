// src/routes/estados.js
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * Paso 3: GET /estados
 * Lista las declaraciones con su último estado y la fecha del último movimiento.
 * Si no hay histórico aún, usa duca.estado_documento y duca.creado_en.
 */
router.get(
  '/',
  requireAuth(['TRANSPORTISTA', 'AGENTE', 'ADMIN']),
  async (req, res) => {
    try {
      // Si quieres filtrar por un transportista específico, agrega WHERE apropiado.
      // Aquí devolvemos todas. Orden descendente por fecha más reciente.
      const q = `
        SELECT
          d.numero_documento,
          COALESCE(
            (
              SELECT e2.estado
              FROM estados e2
              WHERE e2.numero_documento = d.numero_documento
              ORDER BY e2.creado_en DESC
              LIMIT 1
            ),
            d.estado_documento,
            'DESCONOCIDO'
          ) AS estado,
          COALESCE(
            (
              SELECT e3.creado_en
              FROM estados e3
              WHERE e3.numero_documento = d.numero_documento
              ORDER BY e3.creado_en DESC
              LIMIT 1
            ),
            d.creado_en
          ) AS creado
        FROM duca d
        ORDER BY creado DESC NULLS LAST
      `
      const r = await pool.query(q)
      res.json(r.rows)
    } catch (e) {
      console.error('GET /estados error:', e)
      res.status(500).json({ error: 'Error interno en /estados' })
    }
  }
)

/**
 * Paso 4: GET /estados/:numero
 * Devuelve el detalle de la DUCA (incluyendo importador/exportador/transporte)
 * y el historial de cambios de estado.
 */
router.get(
  '/:numero',
  requireAuth(['TRANSPORTISTA', 'AGENTE', 'ADMIN']),
  async (req, res) => {
    try {
      const numero = req.params.numero

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
      `
      const hq = `
        SELECT estado, motivo, creado_en
        FROM estados
        WHERE numero_documento = $1
        ORDER BY creado_en ASC
      `

      const [d, h] = await Promise.all([
        pool.query(dq, [numero]),
        pool.query(hq, [numero]),
      ])

      const duca = d.rows[0] || null
      const historial = h.rows || []
      const estado = historial.at(-1)?.estado ?? duca?.estado_documento ?? 'DESCONOCIDO'

      res.json({
        numero,
        estado,
        historial,
        duca,
      })
    } catch (e) {
      console.error('GET /estados/:numero error:', e)
      res.status(500).json({ error: 'Error interno en /estados/:numero' })
    }
  }
)

export default router
