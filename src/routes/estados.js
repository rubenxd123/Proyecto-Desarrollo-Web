// src/routes/estados.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/duca/estados
router.get("/estados", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT numero, estado,
              TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS creado
       FROM duca
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /api/duca/estados:", e.message);
    res.status(500).json({ message: "Error consultando estados" });
  }
});

export default router;
