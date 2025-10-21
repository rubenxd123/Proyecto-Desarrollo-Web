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
        transporte          = EXCLUDED.transporte
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
      req.user.sub,                 // id del usuario autenticado
    ])

    // primer estado si no existe
    await pool.query(
      `INSERT INTO estados (numero_documento, estado, usuario_id)
       VALUES ($1,'PENDIENTE',$2)
       ON CONFLICT DO NOTHING`,
      [numeroDocumento, req.user.sub]
    )

    await pool.query('COMMIT')
    res.json({ message: 'Declaración registrada', numeroDocumento: r.rows[0].numero_documento })
  } catch (e) {
    await pool.query('ROLLBACK').catch(()=>{})
    // 🔎 DEBUG CONTROLADO: devuelve detalles de PG en no-prod
    const debug = process.env.DEBUG_ERRORS === 'true'
    console.error('POST /duca error:', e)
    return res.status(500).json({
      error: 'Error interno al registrar DUCA',
      ...(debug && {
        code: e.code, detail: e.detail, hint: e.hint, position: e.position,
        message: e.message
      })
    })
  }
})

export default router
