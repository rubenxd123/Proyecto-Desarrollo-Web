import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth(['TRANSPORTISTA']), async (req, res) => {
  const u = req.user;
  const r = await query('SELECT numero_documento, estado_documento, creado_en FROM duca WHERE transportista_id=$1 ORDER BY creado_en DESC', [u.sub]);
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado) VALUES ($1,$2,$3)', [u.sub, 'CONSULTAR_ESTADO', 'OK']);
  res.json(r.rows);
});

export default router;
