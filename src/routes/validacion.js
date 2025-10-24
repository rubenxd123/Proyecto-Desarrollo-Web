// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * Devuelve DUCA en estado PENDIENTE o EN_REVISION
 * Respuesta: Array de objetos { numero, estado, creado }
 */
const getValidaciones = async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        numero_documento AS numero,
        estado_documento AS estado,
        creado_en        AS creado
      FROM duca
      WHERE estado_documento IN ('PENDIENTE','EN_REVISION')
      ORDER BY creado_en DESC
      LIMIT 50;
    `);
    res.json(rows || []);
  } catch (e) {
    console.error("validacion error:", e.message);
    // Para no romper el frontend, devolvemos array vacío en caso de error
    res.json([]);
  }
};

// Ruta base y aliases que el frontend podría usar
router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);

// Fallback: cualquier subruta bajo /validacion/*
router.get("*", getValidaciones);

export default router;
