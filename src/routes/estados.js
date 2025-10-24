// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const ALLOWED_STATES = new Set([
  "PENDIENTE", "EN_REVISION", "VALIDADA", "RECHAZADA", "ANULADA"
]);

/**
 * Lista de DUCA con opción de filtrar por ?estado=...
 * Respuesta: Array de objetos { numero, estado, creado }
 *
 * Ejemplos:
 *   GET /estados                 -> últimos 100
 *   GET /estados?estado=VALIDADA -> solo validadas
 */
const getEstados = async (req, res) => {
  const estado = (req.query.estado || "").toUpperCase().trim();

  // Construye SQL según haya filtro por estado o no
  const whereSql = (estado && ALLOWED_STATES.has(estado))
    ? `WHERE estado_documento = $1`
    : ``;

  const params = (estado && ALLOWED_STATES.has(estado)) ? [estado] : [];

  const sql = `
    SELECT
      numero_documento AS numero,
      estado_documento AS estado,
      creado_en        AS creado
    FROM duca
    ${whereSql}
    ORDER BY creado_en DESC
    LIMIT 100;
  `;

  try {
    const { rows } = await query(sql, params);
    res.json(rows || []);
  } catch (e) {
    console.error("estados error:", e.message);
    res.json([]);
  }
};

// Ruta base
router.get("/", getEstados);

// Algunos aliases comunes
router.get("/mis", getEstados);
router.get("/mis-declaraciones", getEstados);
router.get("/declaraciones", getEstados);
router.get("/list", getEstados);

// Fallback: cualquier subruta bajo /estados/*
router.get("*", getEstados);

export default router;
