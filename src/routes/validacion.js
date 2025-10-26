// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/* ===== Helpers ===== */
const toDateStrings = (dateVal) => {
  if (!dateVal) return { createdISO: null, createdDate: null };
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return { createdISO: null, createdDate: null };
  const iso = d.toISOString();
  return { createdISO: iso, createdDate: iso.slice(0, 10) };
};

const ensureComment = (c) => {
  const s = String(c ?? "").trim();
  if (s.length < 5) {
    const err = new Error("El comentario es obligatorio (mínimo 5 caracteres).");
    err.status = 400;
    throw err;
  }
  return s;
};

/* ===== Listado (pendientes / en revisión) ===== */
const getValidaciones = async (_req, res) => {
  const sql = `
    SELECT
      numero_documento  AS numero_documento,
      estado_documento  AS estado_documento,
      fecha_emision     AS fecha_emision
    FROM duca
    WHERE estado_documento IN ('PENDIENTE','EN_REVISION')
    ORDER BY fecha_emision DESC
    LIMIT 50;
  `;
  try {
    const { rows } = await query(sql);
    const out = rows.map((r) => {
      const { createdISO, createdDate } = toDateStrings(r.fecha_emision);
      return {
        // Español
        numero: r.numero_documento,
        estado: r.estado_documento,
        creado: createdDate,
        // Inglés / aliases
        number: r.numero_documento,
        status: r.estado_documento,
        created: createdDate,
        numero_documento: r.numero_documento,
        numeroDocumento: r.numero_documento,
        estado_documento: r.estado_documento,
        estadoDocumento: r.estado_documento,
        createdAt: createdDate,
        created_at: createdDate,
        fecha_emision: createdDate,
        fechaEmision: createdDate,
        created_iso: createdISO,
      };
    });
    res.json(out);
  } catch (e) {
    console.error("validacion error:", e.message);
    res.json([]);
  }
};

router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);

/* ===== Aprobar ===== */
router.post("/:numero/aprobar", async (req, res) => {
  try {
    const numero = req.params.numero;
    const comentario = ensureComment(req.body?.comentario);

    const upd = await query(
      `
      UPDATE duca
         SET estado_documento = 'VALIDADA'
       WHERE numero_documento = $1
       RETURNING numero_documento, estado_documento
      `,
      [numero]
    );

    if (upd.rowCount === 0) {
      return res.status(404).json({ error: true, message: "DUCA no encontrada" });
    }

    // Bitácora opcional (ignora si no existe la tabla)
    await query(
      `INSERT INTO bitacora(validacion_numero, accion, comentario)
       VALUES ($1,$2,$3)`,
      [numero, "APROBAR", comentario]
    ).catch(() => {});

    res.json({ ok: true, numero, estado: upd.rows[0].estado_documento });
  } catch (e) {
    const status = e.status || 400;
    res.status(status).json({ error: true, message: e.message || "Error de validación" });
  }
});

/* ===== Rechazar ===== */
router.post("/:numero/rechazar", async (req, res) => {
  try {
    const numero = req.params.numero;
    const comentario = ensureComment(req.body?.comentario);

    const upd = await query(
      `
      UPDATE duca
         SET estado_documento = 'RECHAZADA'
       WHERE numero_documento = $1
       RETURNING numero_documento, estado_documento
      `,
      [numero]
    );

    if (upd.rowCount === 0) {
      return res.status(404).json({ error: true, message: "DUCA no encontrada" });
    }

    // Bitácora opcional
    await query(
      `INSERT INTO bitacora(validacion_numero, accion, comentario)
       VALUES ($1,$2,$3)`,
      [numero, "RECHAZAR", comentario]
    ).catch(() => {});

    res.json({ ok: true, numero, estado: upd.rows[0].estado_documento });
  } catch (e) {
    const status = e.status || 400;
    res.status(status).json({ error: true, message: e.message || "Error de validación" });
  }
});

/* Fallback (opcional) */
router.get("*", getValidaciones);

export default router;
