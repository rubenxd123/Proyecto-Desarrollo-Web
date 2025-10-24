// src/server.js
import "dotenv/config";              // carga .env en local
import express from "express";
import cors from "cors";

import ducaRouter from "./routes/duca.js";
import estadosRouter from "./routes/estados.js";
import usuariosRouter from "./routes/usuarios.js";
import authRouter from "./routes/auth.js";
import validacionRouter from "./routes/validacion.js";
import { dbHealth } from "./db.js";  // pequeño chequeo de BD

const app = express();

app.set("trust proxy", 1);

// CORS
const ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const defaultOrigins = [
  "https://frontend-proyecto-0hk1.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: ORIGINS.length ? ORIGINS : defaultOrigins,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health general
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// Health de BD (opcional)
app.get("/health/db", async (req, res) => {
  const info = await dbHealth();
  res.status(info.ok ? 200 : 500).json(info);
});

// Prefijo API
app.use("/api/duca", ducaRouter);
app.use("/api/estados", estadosRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/auth", authRouter);
app.use("/api/validacion", validacionRouter);

// 404 y errores
app.use((req, res) => res.status(404).json({ error: true, message: "Not Found" }));
app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(err.status || 500).json({ error: true, message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
