import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/', requireAuth(['ADMIN']), async (_req, res) => {
  const r = await query('SELECT id, nombre, correo, rol, activo, creado_en FROM usuarios ORDER BY creado_en DESC', []);
  res.json(r.rows);
});

router.post('/', requireAuth(['ADMIN']), async (req, res) => {
  const { nombre, correo, password, rol } = req.body || {};
  if (!nombre || !correo || !password || !rol) return res.status(400).json({ error: 'nombre, correo, password, rol requeridos' });
  const exists = await query('SELECT 1 FROM usuarios WHERE correo=$1', [correo]);
  if (exists.rowCount) return res.status(409).json({ error: 'correo duplicado' });
  const hash = await bcrypt.hash(password, 10);
  const r = await query('INSERT INTO usuarios(nombre, correo, hash_bcrypt, rol) VALUES ($1,$2,$3,$4) RETURNING id, nombre, correo, rol, activo', [nombre, correo, hash, rol]);
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado) VALUES (NULL,$1,$2)', ['CREAR_USUARIO', `OK:${correo}`]);
  res.status(201).json(r.rows[0]);
});

router.put('/:id', requireAuth(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { nombre, activo, rol } = req.body || {};
  const r = await query('UPDATE usuarios SET nombre=COALESCE($1,nombre), activo=COALESCE($2,activo), rol=COALESCE($3,rol) WHERE id=$4 RETURNING id,nombre,correo,rol,activo', [nombre, activo, rol, id]);
  if (!r.rowCount) return res.status(404).json({ error: 'no encontrado' });
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado) VALUES (NULL,$1,$2)', ['EDITAR_USUARIO', `OK:${id}`]);
  res.json(r.rows[0]);
});

router.delete('/:id', requireAuth(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM usuarios WHERE id=$1', [id]);
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado) VALUES (NULL,$1,$2)', ['ELIMINAR_USUARIO', `OK:${id}`]);
  res.status(204).end();
});

export default router;
