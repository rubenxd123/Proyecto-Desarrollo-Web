import express from 'express';
import { query } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });
  const r = await query('SELECT id, correo, hash_bcrypt, rol, activo FROM usuarios WHERE correo=$1', [email]);
  if (r.rowCount === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
  const u = r.rows[0];
  if (!u.activo) return res.status(403).json({ error: 'Usuario inactivo' });
  const ok = await bcrypt.compare(password, u.hash_bcrypt);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ sub: u.id, rol: u.rol, email: u.correo }, process.env.JWT_SECRET, { expiresIn: '2h' });
  await query('INSERT INTO bitacora(usuario_id, operacion, resultado) VALUES ($1,$2,$3)', [u.id, 'LOGIN', 'OK']);
  return res.json({ token, rol: u.rol });
});

export default router;
