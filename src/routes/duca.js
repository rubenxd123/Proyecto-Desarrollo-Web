import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const getPendientes = async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        numero_documento AS numero,
        estado_documento AS estado,
        creado_en AS creado
      FROM duca
      WHERE estado_documento IN ('PENDIENTE','EN_REVISION')
      ORDER BY creado_en DESC
      LIMIT 50;
    `);
    res.json(rows || []);
  } catch (e) {
    console.error("duca/pending error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

const getEstados = async (_req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        numero_documento AS numero,
        estado_documento AS estado,
        creado_en AS creado
      FROM duca
      ORDER BY creado_en DESC
      LIMIT 100;
    `);
    res.json(rows || []);
  } catch (e) {
    console.error("duca/estados error:", e.message);
    res.status(500).json({ error: e.message });
  }
};

// rutas que usa el front
router.get("/pendientes", getPendientes);
router.get("/en-revision", getPendientes);
router.get("/estados", getEstados);
router.get("*", getPendientes);

export default router;
