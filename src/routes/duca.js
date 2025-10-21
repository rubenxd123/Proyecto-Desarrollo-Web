import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// No usaremos transportista_id para evitar errores de tipo.
// Solo guardamos los JSON y creamos el estado PENDIENTE.
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

    // ✅ Insert/Upsert sin transportista_id
    const upsert = `
      INSERT INTO duca (
        numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
        importador, exportador, transporte
      )
      VALUES ($1,$2,$3,$4,$5, $6::jsonb,$7::jsonb,$8::jsonb)
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
    ])

    // ✅ Primer estado sin forzar usuario_id
    await pool.query(
      `INSERT INTO estados (numero_documento, estado)
       VALUES ($1,'PENDIENTE')
       ON CONFLICT DO NOTHING`,
      [numeroDocumento]
    )

    await pool.query('COMMIT')
    res.json({ message: 'Declaración registrada', numeroDocumento: r.rows[0].numero_documento })
  } catch (e) {
    await pool.query('ROLLBACK').catch(()=>{})
    console.error('POST /duca error:', e)
    return res.status(500).json({ error: 'Error interno al registrar DUCA' })
  }
})

export default router
