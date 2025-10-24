// src/routes/duca.js
import { Router } from "express";
import { pool } from "../db.js";
// import { requireAuth } from "../middleware/auth.js"; // si quieres proteger el endpoint

const router = Router();

// POST /api/duca/registrar
router.post("/registrar", /*requireAuth,*/ async (req, res) => {
  try {
    const { numero, paisEmisor, moneda, valorAduanaTotal, estado } = req.body || {};

    if (!numero || !paisEmisor || !moneda || !valorAduanaTotal) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO duca (numero, pais_emisor, moneda, valor_aduana_total, estado)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (numero) DO UPDATE SET
         pais_emisor = EXCLUDED.pais_emisor,
         moneda = EXCLUDED.moneda,
         valor_aduana_total = EXCLUDED.valor_aduana_total,
         estado = EXCLUDED.estado
       RETURNING id, numero, estado, created_at`,
      [numero, paisEmisor, moneda, valorAduanaTotal, estado || "Pendiente"]
    );

    res.status(201).json({ message: "DUCA registrada", data: rows[0] });
  } catch (e) {
    console.error("POST /api/duca/registrar:", e.message);
    res.status(500).json({ message: "Error registrando DUCA" });
  }
});

export default router;
