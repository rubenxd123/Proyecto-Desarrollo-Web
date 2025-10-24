// backend/estados.js
import { Router } from "express";
import { pool } from "./db.js";
const router = Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT numero, estado, to_char(created_at,'YYYY-MM-DD HH24:MI') AS creado
       FROM duca ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /estados:", e.message);
    res.status(500).json({ message: "Error consultando estados" });
  }
});

export default router;
