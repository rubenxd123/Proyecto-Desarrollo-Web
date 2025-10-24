// src/server.js
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import ducaRoutes from "./duca.js";
import estadosRoutes from "./estados.js";
import validacionRoutes from "./validation.js";

const app = express();

// 🟢 Cambia esta URL por la del frontend en Render
const FRONT_ORIGIN = "https://frontend-proyecto-0hk1.onrender.com";

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === FRONT_ORIGIN) return cb(null, true);
      return cb(new Error("CORS bloqueado"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.options("*", cors());

// === Health checks ===
app.get("/", (_req, res) => res.json({ ok: true, service: "aduanas-duca-api" }));

app.get("/health/db", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ db: "ok" });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
});

// === Importación de rutas ===
app.use("/api/duca", ducaRoutes);
app.use("/api/duca", estadosRoutes);
app.use("/api/duca", validacionRoutes);

// === Arranque ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ API ejecutándose en puerto ${PORT}`));
