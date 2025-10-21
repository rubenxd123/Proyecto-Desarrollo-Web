import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth(['TRANSPORTISTA','ADMIN']), async (req, res) => {
  const {
    numeroDocumento, fechaEmision, paisEmisor, moneda, valorAduanaTotal,
    importador, exportador, transporte
  } = req.body || {}

  if (!numeroDocumento || !fechaEmision || !paisEmisor || !moneda || (valorAduanaTotal == null)) {
    return res.status(400).json({ error: 'Datos inválidos' })
  }

  try {
    await pool.query('BEGIN')

    // UPSERT (sin depender de transportista_id)
    const upsert = `
      INSERT INTO duca (
        numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
        importador, exportador, transporte
      )
      VALUES ($1,$2,$3,$4,$5, $6::jsonb, $7::jsonb, $8::jsonb)
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

    const args = [
      numeroDocumento,
      fechaEmision, // 'YYYY-MM-DD'
      paisEmisor,
      moneda,
      valorAduanaTotal,
      importador ? JSON.stringify(importador) : null,
      exportador ? JSON.stringify(exportador) : null,
      transporte ? JSON.stringify(transporte) : null,
    ]

    const r = await pool.query(upsert, args)

    // Asegura primer estado PENDIENTE si no existe aún
    await pool.query(`
      INSERT INTO estados (numero_documento, estado)
      SELECT $1, 'PENDIENTE'
      WHERE NOT EXISTS (
        SELECT 1 FROM estados WHERE numero_documento = $1
      )
    `, [numeroDocumento])

    await pool.query('COMMIT')
    return res.json({ message: 'Declaración registrada', numeroDocumento: r.rows[0].numero_documento })
  } catch (e) {
    await pool.query('ROLLBACK').catch(()=>{})
    console.error('POST /duca error:', e)
    // API mantiene texto; el front ya muestra mensaje agradable
    return res.status(500).json({ error: 'Error interno al registrar DUCA' })
  }
})

export default router
