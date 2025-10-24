// src/routes/duca.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const getPendientes = async (req, res) => {
  try {
    const { rows } = await query?.(
      "SELECT numero, estado, creado FROM declaraciones WHERE estado IN ('pendiente','revision') ORDER BY creado DESC LIMIT 50"
    ) ?? { rows: [] };
    res.json({ items: rows });
  } catch (e) {
    console.error("duca/pending error:", e.message);
    res.json({ items: [] });
  }
};

// Soporta múltiples rutas que el frontend podría usar
router.get("/pending", getPendientes);
router.get("/pendientes", getPendientes);
router.get("/en-revision", getPendientes);
router.get("/review", getPendientes);

export default router;
