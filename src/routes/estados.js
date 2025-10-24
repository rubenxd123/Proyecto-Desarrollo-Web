// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const safeRows = async (sql) => {
  try {
    if (!query) return [];
    const { rows } = await query(sql);
    return rows || [];
  } catch (e) {
    console.error("estados route error:", e.message);
    return [];
  }
};

const getEstados = async (req, res) => {
  const rows = await safeRows(
    "SELECT numero, estado, creado FROM declaraciones ORDER BY creado DESC LIMIT 100"
  );
  res.json({ items: rows });
};

router.get("/", getEstados);
router.get("/mis", getEstados);
router.get("/mis-declaraciones", getEstados);
router.get("/declaraciones", getEstados);
router.get("/list", getEstados);
router.get("*", getEstados);

export default router;
