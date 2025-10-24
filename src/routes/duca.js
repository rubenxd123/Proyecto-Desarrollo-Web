import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth(), async (req, res) => {
  try {
    const {
      numeroDocumento,
      fechaEmision,
      paisEmisor,
      moneda,
      valorAduanaTotal,
      importador,
      exportador,
      transporte
    } = req.body

    if (!numeroDocumento) {
      return res.status(400).json({ error: 'Falta número de documento' })
    }

    // Inserta/actualiza DUCA (guarda JSON completos si existen)
    await pool.query(
      `INSERT INTO duca (
         numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
         importador, exportador, transporte
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb)
       ON CONFLICT (numero_documento) DO UPDATE SET
         fecha_emision      = EXCLUDED.fecha_emision,
         pais_emisor        = EXCLUDED.pais_emisor,
         moneda             = EXCLUDED.moneda,
         valor_aduana_total = EXCLUDED.valor_aduana_total,
         importador         = EXCLUDED.importador,
         exportador         = EXCLUDED.exportador,
         transporte         = EXCLUDED.transporte`,
      [
        numeroDocumento,
        fechaEmision || null,
        paisEmisor || null,
        moneda || null,
        valorAduanaTotal ?? null,
        JSON.stringify(importador || {}),
        JSON.stringify(exportador || {}),
        JSON.stringify(transporte || {}),
      ]
    )

    // Asegura estado inicial PENDIENTE
    await pool.query(
      `INSERT INTO estados (numero_documento, estado, creado_en)
       SELECT $1, 'PENDIENTE', NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM estados WHERE numero_documento = $1
       )`,
      [numeroDocumento]
    )

    res.json({ message: 'Declaración registrada', numeroDocumento })
  } catch (e) {
    console.error('POST /duca error:', e)
    res.status(500).json({ error: 'Error interno al registrar DUCA' })
  }
})

export default router
