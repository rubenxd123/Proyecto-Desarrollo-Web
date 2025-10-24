// src/duca.js
import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

// POST /api/duca/registrar
router.post("/registrar", async (req, res) => {
  try {
    const { numero, paisEmisor, moneda, valorAduanaTotal, estado } = req.body;

    if (!numero || !paisEmisor || !moneda || !valorAduanaTotal) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO duca (numero, pais_emisor, moneda, valor_aduana_total, estado)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (numero) DO UPDATE SET
         pais_emisor=EXCLUDED.pais_emisor,
         moneda=EXCLUDED.moneda,
         valor_aduana_total=EXCLUDED.valor_aduana_total,
         estado=EXCLUDED.estado
       RETURNING id, numero, estado, created_at`,
      [numero, paisEmisor, moneda, valorAduanaTotal, estado || "Pendiente"]
    );

    res.status(201).json({ message: "DUCA registrada con éxito", data: rows[0] });
  } catch (error) {
    console.error("❌ Error en POST /api/duca/registrar:", error.message);
    res.status(500).json({ message: "Error al registrar DUCA" });
  }
});

export default router;
