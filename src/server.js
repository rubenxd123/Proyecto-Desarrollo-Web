// backend/server.js
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import ducaRoutes from "./duca.js";
import estadosRoutes from "./estados.js";
import validationRoutes from "./validation.js";

const app = express();

// IMPORTANTE: dominio del frontend en Render
const FRONT_ORIGIN = "https://frontend-proyecto-0hk1.onrender.com";

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === FRONT_ORIGIN) return cb(null, true);
    return cb(new Error("Origen no permitido por CORS"));
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true,
}));

app.options("*", cors());
app.use(express.json());

// Health API
app.get("/", (_req, res) => res.json({ ok: true, service: "aduanas-duca-api" }));

// Health DB
app.get("/health/db", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1");
    res.json({ db: "ok", result: r.rows[0] });
  } catch (e) {
    console.error("DB ERROR:", e.message);
    res.status(500).json({ db: "down", error: e.message });
  }
});

// Rutas de negocio
app.use("/duca", ducaRoutes);          // POST /duca
app.use("/estados", estadosRoutes);    // GET  /estados
app.use("/validacion", validationRoutes); // GET /validacion

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("API en puerto", PORT));
