import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth(['TRANSPORTISTA','ADMIN']), async (req, res) => {
  const {
    numeroDocumento, fechaEmision, paisEmisor, moneda, valorAduanaTotal,
    importador, exportador, transporte
  } = req.body || {}

  if (!numeroDocumento || !fechaEmision || !paisEmisor || !moneda || valorAduanaTotal == null) {
    return res.status(400).json({ error: 'Datos inválidos' })
  }

  // ⚠️ El sub puede ser string no numérico. Guardamos NULL si no es número.
  const subRaw = req.user?.sub
  const transportistaId = Number.isFinite(Number(subRaw)) ? Number(subRaw) : null

  try {
    await pool.query('BEGIN')

    const upsert = `
      INSERT INTO duca (
        numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
        importador, exportador, transporte, transportista_id
      )
      VALUES ($1,$2,$3,$4,$5, $6::jsonb,$7::jsonb,$8::jsonb,$9)
      ON CONFLICT (numero_documento) DO UPDATE SET
        fecha_emision       = EXCLUDED.fecha_emision,
        pais_emisor         = EXCLUDED.pais_emisor,
        moneda              = EXCLUDED.moneda,
        valor_aduana_total  = EXCLUDED.valor_aduana_total,
        importador          = EXCLUDED.importador,
        exportador          = EXCLUDED.exportador,
        transporte          = EXCLUDED.transporte,
        transportista_id    = EXCLUDED.transportista_id
      RETURNING numero_documento
    `

    const r = await pool.query(upsert, [
      numeroDocumento,
      fechaEmision,                 // 'YYYY-MM-DD'
      paisEmisor,
      moneda,
      valorAduanaTotal,
      JSON.stringify(importador ?? null),
      JSON.stringify(exportador ?? null),
      JSON.stringify(transporte ?? null),
      transportistaId,
    ])

    // Primer estado si no existe
    await pool.query(
      `INSERT INTO estados (numero_documento, estado, usuario_id)
       VALUES ($1,'PENDIENTE',$2)
       ON CONFLICT DO NOTHING`,
      [numeroDocumento, transportistaId]
    )

    await pool.query('COMMIT')
    res.json({ message: 'Declaración registrada', numeroDocumento: r.rows[0].numero_documento })
  } catch (e) {
    await pool.query('ROLLBACK').catch(()=>{})
    console.error('POST /duca error:', e)

    // Habilita DEBUG_ERRORS=true en Render → Environment
    const debug = process.env.DEBUG_ERRORS === 'true'
    return res.status(500).json({
      error: 'Error interno al registrar DUCA',
      ...(debug && {
        code: e.code, detail: e.detail, hint: e.hint, position: e.position, message: e.message
      })
    })
  }
})

export default router
