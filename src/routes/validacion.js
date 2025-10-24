// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * DUCA en PENDIENTE o EN_REVISION
 * Responde: Array de { number, status, created }
 */
const getValidaciones = async (_req, res) => {
  const sql = `
    SELECT
      numero_documento  AS "number",
      estado_documento  AS "status",
      fecha_emision     AS "created"
    FROM duca
    WHERE estado_documento IN ('PENDIENTE','EN_REVISION')
    ORDER BY fecha_emision DESC
    LIMIT 50;
  `;
  try {
    const { rows } = await query(sql, []);
    res.json(rows || []);
  } catch (e) {
    console.error("validacion error:", e.message);
    // si hay error de BD, no rompas el front
    res.json([]);
  }
};

router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);
router.get("*", getValidaciones);

export default router;
