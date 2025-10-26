// src/server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------------- Middlewares base ---------------- */
app.use(cors());               // si luego usas cookies, ajusta origin/credentials
app.use(express.json());

// Logger opcional: si morgan no está instalado, seguimos sin romper
let loggerMiddleware = (req, _res, next) => next();
try {
  const mod = await import("morgan");
  loggerMiddleware = mod.default("dev");
} catch {
  console.log("ℹ️  morgan no instalado; continuando sin logger HTTP");
}
app.use(loggerMiddleware);

/* ---------------- Endpoints de salud/raíz ---------------- */
app.head("/", (_req, res) => res.status(200).end());
app.get("/", (_req, res) =>
  res.status(200).json({ ok: true, service: "aduanas-duca-api", ts: new Date().toISOString() })
);
app.get("/healthz", (_req, res) =>
  res.status(200).json({ status: "ok", ts: new Date().toISOString() })
);

/* ---------------- Importar rutas y montarlas ---------------- */
async function mountRoutes() {
  try {
    // Forzamos import de DB para atrapar errores temprano
    await import("./db.js");

    // === NUEVO: auth ===
    const authRoutes = await import("./routes/auth.js").catch((e) => {
      console.error("❌ Error importando ./routes/auth.js:", e?.stack || e);
      throw e;
    });

    const validacionRoutes = await import("./routes/validacion.js").catch((e) => {
      console.error("❌ Error importando ./routes/validacion.js:", e?.stack || e);
      throw e;
    });

    const estadosRoutes = await import("./routes/estados.js").catch((e) => {
      console.error("❌ Error importando ./routes/estados.js:", e?.stack || e);
      throw e;
    });

    let ducaRoutes = null;
    try {
      ducaRoutes = (await import("./routes/duca.js")).default;
    } catch (e) {
      console.warn("⚠️  No se montó /duca (routes/duca.js no encontrado o con error):", e?.message);
    }

    // Montaje
    app.use("/auth", authRoutes.default);        // <— POST /auth/login
    app.use("/validacion", validacionRoutes.default);
    app.use("/estados", estadosRoutes.default);
    if (ducaRoutes) app.use("/duca", ducaRoutes);

    console.log("✅ Rutas montadas correctamente");
  } catch (e) {
    console.error("💥 Fallo montando rutas o db:", e?.stack || e);
    app.get("/__boot_error", (_req, res) => {
      res.status(500).json({ boot_error: String(e?.message || e), stack: e?.stack });
    });
    throw e;
  }
}

/* ---------------- Arranque del servidor ---------------- */
async function start() {
  try {
    await mountRoutes();
    app.listen(PORT, () => {
      console.log(`✅ API listening on ${PORT}`);
    });
  } catch (e) {
    console.error("🚫 La app no pudo iniciar:", e?.stack || e);
    setTimeout(() => process.exit(1), 500);
  }
}

/* ---------------- Handlers globales de errores ---------------- */
process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err?.stack || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("🔥 unhandledRejection:", reason);
});
process.on("SIGTERM", () => {
  console.log("⏹️  SIGTERM recibido, cerrando...");
  process.exit(0);
});

/* ---------------- GO ---------------- */
start();
