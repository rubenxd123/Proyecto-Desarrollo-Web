// src/server.js
import express from "express";
import cors from "cors";
import { config } from "dotenv";
config();

import { pool } from "./db.js";
import ducaRoutes from "./routes/duca.js";
import estadosRoutes from "./routes/estados.js";
import validacionRoutes from "./routes/validacion.js";

const app = express();

// Cambia a tu dominio del frontend en Render
const FRONT_ORIGIN = "https://frontend-proyecto-0hk1.onrender.com";

app.use(cors({
  origin: (origin, cb) => (!origin || origin === FRONT_ORIGIN) ? cb(null, true) : cb(new Error("CORS")),
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));
app.options("*", cors());
app.use(express.json());

// Health
app.get("/", (_req, res) => res.json({ ok: true, service: "aduanas-duca-api" }));
app.get("/health/db", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ db: "ok" }); }
  catch (e) { res.status(500).json({ db: "down", error: e.message }); }
});

// Rutas del documento (todas bajo /api/duca/…)
app.use("/api/duca", ducaRoutes);       // /api/duca/registrar (POST)
app.use("/api/duca", estadosRoutes);    // /api/duca/estados    (GET)
app.use("/api/duca", validacionRoutes); // /api/duca/validacion (GET)

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ API en puerto ${PORT}`));
