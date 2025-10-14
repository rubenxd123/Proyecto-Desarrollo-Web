import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Registrar DUCA (estado inicial PENDIENTE)
router.post('/', requireAuth(['TRANSPORTISTA']), async (req, res) => {
  const body = req.body || {};
  const u = req.user;
  try {
    const duca = body;
    // Upsert de actores relacionados (simplificado)
    let importador_id = null, exportador_id = null, transporte_id = null;

    if (duca.importador) {
      const r = await query('INSERT INTO importador(nombre, documento, pais) VALUES ($1,$2,$3) RETURNING id',
        [duca.importador.nombre || null, duca.importador.documento || null, duca.importador.pais || null]);
      importador_id = r.rows[0].id;
    }
    if (duca.exportador) {
      const r = await query('INSERT INTO exportador(nombre, documento, pais) VALUES ($1,$2,$3) RETURNING id',
        [duca.exportador.nombre || null, duca.exportador.documento || null, duca.exportador.pais || null]);
      exportador_id = r.rows[0].id;
    }
    if (duca.transporte) {
      const r = await query('INSERT INTO transporte(medio, placa, conductor, ruta) VALUES ($1,$2,$3,$4) RETURNING id',
        [duca.transporte.medio || null, duca.transporte.placa || null, duca.transporte.conductor || null, duca.transporte.ruta || null]);
      transporte_id = r.rows[0].id;
    }

    await query(
      `INSERT INTO duca(numero_documento, fecha_emision, pais_emisor, tipo_operacion, estado_documento, moneda, valor_aduana_total, resultado_selectivo, firma_electronica, importador_id, exportador_id, transporte_id, transportista_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        duca.numeroDocumento, duca.fechaEmision, duca.paisEmisor, duca.tipoOperacion || null,
        'PENDIENTE', duca.moneda || null, duca.valorAduanaTotal || null, duca.resultadoSelectivo || null, duca.firmaElectronica || null,
        importador_id, exportador_id, transporte_id, u.sub
      ]
    );

    if (Array.isArray(duca.mercancias)) {
      for (const item of duca.mercancias) {
        await query('INSERT INTO mercancias_item(numero_documento, item_no, descripcion, cantidad, unidad, valor) VALUES ($1,$2,$3,$4,$5,$6)',
          [duca.numeroDocumento, item.itemNo, item.descripcion, item.cantidad, item.unidad || null, item.valor || null]);
      }
    }

    await query('INSERT INTO bitacora(usuario_id, operacion, resultado, numero_documento) VALUES ($1,$2,$3,$4)',
      [u.sub, 'REGISTRAR_DUCA', 'OK', duca.numeroDocumento]);
    res.status(201).json({ message: 'Declaración registrada', numeroDocumento: duca.numeroDocumento });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Datos inválidos' });
  }
});

// Listar declaraciones del transportista autenticado
router.get('/', requireAuth(['TRANSPORTISTA']), async (req, res) => {
  const u = req.user;
  const r = await query('SELECT numero_documento, estado_documento, creado_en FROM duca WHERE transportista_id=$1 ORDER BY creado_en DESC', [u.sub]);
  res.json(r.rows);
});

// Detalle por numeroDocumento (cualquier rol autenticado)
router.get('/:numeroDocumento', requireAuth(['ADMIN','TRANSPORTISTA','AGENTE']), async (req, res) => {
  const { numeroDocumento } = req.params;
  const r = await query('SELECT * FROM duca WHERE numero_documento=$1', [numeroDocumento]);
  if (!r.rowCount) return res.status(404).json({ error: 'No encontrado' });
  res.json(r.rows[0]);
});

export default router;
