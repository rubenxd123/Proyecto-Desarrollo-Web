// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * Devuelve todas las DUCA en estado PENDIENTE o EN_REVISION.
 * Usa la columna fecha_emision como "creado" para mostrar en el frontend.
 */
const getValidaciones = async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        numero_documento AS numero,
        estado_documento AS estado,
        fecha_emision    AS creado
      FROM duca
      WHERE estado_documento IN ('PENDIENTE', 'EN_REVISION')
      ORDER BY fecha_emision DESC
      LIMIT 50;
    `);
    res.json(rows || []);
  } catch (e) {
    console.error("validacion error:", e.message);
    res.json([]);
  }
};

// Rutas disponibles
router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);
router.get("*", getValidaciones);

export default router;
