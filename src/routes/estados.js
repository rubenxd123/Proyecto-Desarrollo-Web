// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const getEstados = async (req, res) => {
  try {
    const { rows } = await query?.(
      "SELECT numero, estado, creado FROM declaraciones ORDER BY creado DESC LIMIT 100"
    ) ?? { rows: [] };
    res.json({ items: rows });
  } catch (e) {
    console.error("estados error:", e.message);
    res.json({ items: [] });
  }
};

// ruta base
router.get("/", getEstados);

// alias frecuentes
router.get("/mis", getEstados);
router.get("/mis-declaraciones", getEstados);
router.get("/declaraciones", getEstados);
router.get("/list", getEstados);

export default router;
