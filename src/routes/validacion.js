import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/pendientes', requireAuth(['AGENTE']), async (_req, res) => {
  const r = await query("SELECT numero_documento, estado_documento, creado_en FROM duca WHERE estado_documento IN ('PENDIENTE','EN_REVISION') ORDER BY creado_en ASC", []);
  res.json(r.rows);
});

router.post('/:numeroDocumento/aprobar', requireAuth(['AGENTE']), async (req, res) => {
  const { numeroDocumento } = req.params;
  const r = await query("UPDATE duca SET estado_documento='VALIDADA' WHERE numero_documento=$1 RETURNING numero_documento", [numeroDocumento]);
  if (!r.rowCount) return res.status(404).json({ error: 'No encontrado' });
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado, numero_documento) VALUES ($1,$2,$3,$4)',
    [req.user.sub, 'APROBAR', 'OK', numeroDocumento]);
  res.json({ message: 'Aprobado', numeroDocumento });
});

router.post('/:numeroDocumento/rechazar', requireAuth(['AGENTE']), async (req, res) => {
  const { numeroDocumento } = req.params;
  const r = await query("UPDATE duca SET estado_documento='RECHAZADA' WHERE numero_documento=$1 RETURNING numero_documento", [numeroDocumento]);
  if (!r.rowCount) return res.status(404).json({ error: 'No encontrado' });
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado, numero_documento) VALUES ($1,$2,$3,$4)',
    [req.user.sub, 'RECHAZAR', req.body?.motivo ? 'ERROR:'+req.body.motivo : 'OK', numeroDocumento]);
  res.json({ message: 'Rechazado', numeroDocumento });
});

export default router;
