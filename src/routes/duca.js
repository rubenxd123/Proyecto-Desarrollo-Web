// src/routes/duca.js
import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * Crea o actualiza una DUCA.
 * Requiere rol TRANSPORTISTA.
 * Guarda importador/exportador/transporte/mercancias como JSONB.
 */
router.post('/', requireAuth(['TRANSPORTISTA']), async (req, res) => {
  try {
    const b = req.body || {}

    // Validación mínima
    const faltan = []
    if (!b.numeroDocumento)            faltan.push('numeroDocumento')
    if (!b.fechaEmision)               faltan.push('fechaEmision (YYYY-MM-DD)')
    if (!b.paisEmisor)                 faltan.push('paisEmisor')
    if (!b.moneda)                     faltan.push('moneda')
    if (b.valorAduanaTotal == null)    faltan.push('valorAduanaTotal')
    if (!b.importador)                 faltan.push('importador')
    if (!b.exportador)                 faltan.push('exportador')
    if (!b.transporte)                 faltan.push('transporte')
    if (!Array.isArray(b.mercancias))  faltan.push('mercancias[]')

    if (faltan.length) {
      return res.status(400).json({ error: 'Datos inválidos', campos: faltan })
    }

    // Normalización
    const numeroDocumento  = String(b.numeroDocumento).trim()
    const fechaEmision     = String(b.fechaEmision)           // YYYY-MM-DD
    const paisEmisor       = String(b.paisEmisor).trim()
    const moneda           = String(b.moneda).trim()
    const valorTotal       = Number(b.valorAduanaTotal)

    // JSONB → stringify + ::jsonb en la query
    const importador  = JSON.stringify(b.importador || {})
    const exportador  = JSON.stringify(b.exportador || {})
    const transporte  = JSON.stringify(b.transporte || {})
    const mercancias  = JSON.stringify(b.mercancias || [])

    const transportistaId = req.user.sub // del token JWT

    const upsertSql = `
      INSERT INTO duca (
        numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
        importador, exportador, transporte, mercancias, transportista_id, creado_en
      )
      VALUES ($1,$2,$3,$4,$5, $6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb, $10, now())
      ON CONFLICT (numero_documento) DO UPDATE SET
        fecha_emision       = EXCLUDED.fecha_emision,
        pais_emisor         = EXCLUDED.pais_emisor,
        moneda              = EXCLUDED.moneda,
        valor_aduana_total  = EXCLUDED.valor_aduana_total,
        importador          = EXCLUDED.importador,
        exportador          = EXCLUDED.exportador,
        transporte          = EXCLUDED.transporte,
        mercancias          = EXCLUDED.mercancias
      RETURNING numero_documento;
    `

    await pool.query(upsertSql, [
      numeroDocumento,
      fechaEmision,
      paisEmisor,
      moneda,
      valorTotal,
      importador,
      exportador,
      transporte,
      mercancias,
      transportistaId
    ])

    // Asegura estado inicial
    await pool.query(
      `INSERT INTO estados (numero_documento, estado, creado_en, usuario_id)
       VALUES ($1, 'PENDIENTE', now(), $2)
       ON CONFLICT DO NOTHING;`,
      [numeroDocumento, transportistaId]
    )

    return res.json({ message: 'Declaración registrada', numeroDocumento })
  } catch (e) {
    console.error('[POST /duca] error:', e)
    return res.status(500).json({ error: 'Error interno al registrar DUCA' })
  }
})

export default router
