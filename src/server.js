// src/server.js
import express from "express";
import cors from "cors";
import ducaRouter from "./routes/duca.js";
import estadosRouter from "./routes/estados.js";
import usuariosRouter from "./routes/usuarios.js";
import authRouter from "./routes/auth.js";
import validacionRouter from "./routes/validacion.js";

const app = express();

// --- Seguridad/Proxy de Render ---
app.set("trust proxy", 1);

// --- CORS (habilita tu frontend de Render) ---
const ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  "https://frontend-proyecto-0hk1.onrender.com", // tu frontend
  "http://localhost:5173", // Vite local
  "http://localhost:3000"  // CRA local
];

app.use(cors({
  origin: ORIGINS.length ? ORIGINS : defaultOrigins,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());

// --- Parsers ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Healthcheck (para probar fácilmente en el navegador) ---
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// --- Prefijo de API: todo vive bajo /api ---
app.use("/api/duca", ducaRouter);
app.use("/api/estados", estadosRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/auth", authRouter);
app.use("/api/validacion", validacionRouter);

// --- 404 uniforme ---
app.use((req, res, next) => {
  res.status(404).json({ error: true, message: "Not Found" });
});

// --- Manejo de errores JSON ---
app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error"
  });
});

// --- Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
