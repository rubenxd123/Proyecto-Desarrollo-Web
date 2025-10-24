// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const safeRows = async (sql) => {
  try {
    if (!query) return [];
    const { rows } = await query(sql);
    return rows || [];
  } catch (e) {
    console.error("validacion route error:", e.message);
    return [];
  }
};

const getValidaciones = async (req, res) => {
  const rows = await safeRows(
    "SELECT numero, estado, creado FROM declaraciones WHERE estado IN ('pendiente','revision') ORDER BY creado DESC LIMIT 50"
  );
  res.json({ items: rows });
};

router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);
router.get("*", getValidaciones);

export default router;
