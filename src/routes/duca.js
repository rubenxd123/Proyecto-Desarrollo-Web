import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Crea/actualiza DUCA
router.post('/', requireAuth(['TRANSPORTISTA']), async (req, res) => {
  try {
    const {
      numeroDocumento,
      fechaEmision,
      paisEmisor,
      moneda,
      valorAduanaTotal,
      importador = {},
      exportador = {},
      transporte = {}
    } = req.body || {};

    // Validaciones mínimas
    if (!numeroDocumento || !fechaEmision || !paisEmisor || !moneda) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Cast seguro a JSONB
    const impJson = JSON.stringify(importador || {});
    const expJson = JSON.stringify(exportador || {});
    const traJson = JSON.stringify(transporte || {});

    // transportista_id desde el token
    const transportistaId = req.user?.sub ?? null;

    // Insert / upsert
    await pool.query(`
      INSERT INTO duca (
        numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
        importador, exportador, transporte, transportista_id
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9)
      ON CONFLICT (numero_documento) DO UPDATE SET
        fecha_emision      = EXCLUDED.fecha_emision,
        pais_emisor        = EXCLUDED.pais_emisor,
        moneda             = EXCLUDED.moneda,
        valor_aduana_total = EXCLUDED.valor_aduana_total,
        importador         = EXCLUDED.importador,
        exportador         = EXCLUDED.exportador,
        transporte         = EXCLUDED.transporte
    `, [
      numeroDocumento,
      fechaEmision,
      paisEmisor,
      moneda,
      Number(valorAduanaTotal ?? 0),
      impJson,
      expJson,
      traJson,
      transportistaId
    ]);

    return res.json({
      message: 'Declaración registrada',
      numeroDocumento
    });
  } catch (e) {
    console.error('POST /duca error:', e);
    return res.status(500).json({ error: 'Error interno al registrar DUCA' });
  }
});

export default router;
