// src/routes/usuarios.js
import express from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";

const router = express.Router();

/**
 * GET /usuarios
 * Lista todos los usuarios
 */
router.get("/", async (_req, res) => {
  try {
    const result = await query(`
      SELECT id, nombre, correo, rol, activo
      FROM usuarios
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error GET /usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/**
 * POST /usuarios
 * Crea un nuevo usuario
 */
router.post("/", async (req, res) => {
  try {
    const { nombre, correo, password, rol, activo = true } = req.body;
    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const existe = await query("SELECT 1 FROM usuarios WHERE correo=$1", [correo]);
    if (existe.rowCount > 0) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }

    const hash = await bcrypt.hash(password, 10);
    const nuevo = await query(
      `INSERT INTO usuarios (nombre, correo, hash_bcrypt, rol, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, correo, rol, activo`,
      [nombre, correo, hash, rol, activo]
    );

    res.status(201).json(nuevo.rows[0]);
  } catch (err) {
    console.error("❌ Error POST /usuarios:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

/**
 * PATCH /usuarios/:id/activo
 * Cambia el estado activo/inactivo del usuario
 */
router.patch("/:id/activo", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { activo } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    if (typeof activo !== "boolean") return res.status(400).json({ error: "El campo activo debe ser booleano" });

    const upd = await query(
      `UPDATE usuarios SET activo=$1 WHERE id=$2
       RETURNING id, nombre, correo, rol, activo`,
      [activo, id]
    );

    if (upd.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(upd.rows[0]);
  } catch (err) {
    console.error("❌ Error PATCH /usuarios/:id/activo:", err);
    res.status(500).json({ error: "Error al cambiar estado de usuario" });
  }
});

export default router;
