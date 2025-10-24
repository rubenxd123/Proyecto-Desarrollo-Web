// src/server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------------- Middlewares base ---------------- */
app.use(cors());
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

/* ---------------- Importar rutas con protección ---------------- */
async function mountRoutes() {
  try {
    // db.js puede lanzar al importarse: mejor importarlo aquí para loguear bien
    const db = await import("./db.js").catch((e) => {
      console.error("❌ Error importando ./db.js:", e?.stack || e);
      throw e;
    });

    // Rutas: importa dinámico para atrapar errores de sintaxis o dependencias faltantes
    const validacionRoutes = await import("./routes/validacion.js").catch((e) => {
      console.error("❌ Error importando ./routes/validacion.js:", e?.stack || e);
      throw e;
    });
    const estadosRoutes = await import("./routes/estados.js").catch((e) => {
      console.error("❌ Error importando ./routes/estados.js:", e?.stack || e);
      throw e;
    });

    // Si añadiste la ruta de detalle:
    let ducaRoutes = null;
    try {
      ducaRoutes = (await import("./routes/duca.js")).default;
    } catch (e) {
      console.warn("⚠️  No se montó /duca (routes/duca.js no encontrado o con error):", e?.message);
    }

    app.use("/validacion", validacionRoutes.default);
    app.use("/estados", estadosRoutes.default);
    if (ducaRoutes) app.use("/duca", ducaRoutes);

    console.log("✅ Rutas montadas correctamente");
  } catch (e) {
    // Log detallado y no salimos del proceso hasta imprimirlo
    console.error("💥 Fallo montando rutas o db:", e?.stack || e);
    // Forzamos status endpoint a mostrar el error para diagnósticos rápidos
    app.get("/__boot_error", (_req, res) => {
      res.status(500).json({ boot_error: String(e?.message || e), stack: e?.stack });
    });
    // Re-lanzamos para que Render marque el deploy como fallido y veas el stack
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
    // Pequeño retraso para que Render alcance a capturar el log
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
