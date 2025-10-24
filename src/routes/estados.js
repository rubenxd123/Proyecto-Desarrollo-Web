// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * Lista de todos los DUCA con sus estados y fecha_emision como "creado".
 * Permite filtro opcional por ?estado=...
 */
const getEstados = async (req, res) => {
  const estado = (req.query.estado || "").toUpperCase().trim();
  const allowed = ["PENDIENTE", "EN_REVISION", "VALIDADA", "RECHAZADA", "ANULADA"];

  const whereSql = allowed.includes(estado)
    ? `WHERE estado_documento = $1`
    : ``;

  const params = allowed.includes(estado) ? [estado] : [];

  const sql = `
    SELECT
      numero_documento AS numero,
      estado_documento AS estado,
      fecha_emision    AS creado
    FROM duca
    ${whereSql}
    ORDER BY fecha_emision DESC
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

// Rutas disponibles
router.get("/", getEstados);
router.get("/mis", getEstados);
router.get("/mis-declaraciones", getEstados);
router.get("/declaraciones", getEstados);
router.get("/list", getEstados);
router.get("*", getEstados);

export default router;
