// src/routes/duca.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const safeRows = async (sql) => {
  try {
    if (!query) return [];
    const { rows } = await query(sql);
    return rows || [];
  } catch (e) {
    // Si la tabla no existe o hay error de BD, no rompas el front:
    console.error("duca route error:", e.message);
    return [];
  }
};

// Pendientes / revisión
const getPendientes = async (req, res) => {
  const rows = await safeRows(
    "SELECT numero, estado, creado FROM declaraciones WHERE estado IN ('pendiente','revision') ORDER BY creado DESC LIMIT 50"
  );
  res.json({ items: rows });
};

// Estados (alias que tu front está llamando como /api/duca/estados)
const getEstados = async (req, res) => {
  const rows = await safeRows(
    "SELECT numero, estado, creado FROM declaraciones ORDER BY creado DESC LIMIT 100"
  );
  res.json({ items: rows });
};

// Rutas explícitas
router.get("/pending", getPendientes);
router.get("/pendientes", getPendientes);
router.get("/en-revision", getPendientes);
router.get("/review", getPendientes);

// 👉 alias solicitado por tu front:
router.get("/estados", getEstados);

// Fallback: cualquier otra subruta bajo /duca/*
router.get("*", getPendientes);

export default router;
