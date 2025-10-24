// src/validation.js
import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

// GET /api/duca/validacion
router.get("/validacion", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT numero, estado, 
              TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS creado
       FROM duca
       WHERE estado IN ('Pendiente','En revisión')
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error en GET /api/duca/validacion:", error.message);
    res.status(500).json({ message: "Error al consultar pendientes o revisiones" });
  }
});

export default router;
