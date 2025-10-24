// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const ALLOWED = new Set(["PENDIENTE","EN_REVISION","VALIDADA","RECHAZADA","ANULADA"]);

const toDateStrings = (dateVal) => {
  if (!dateVal) {
    return { createdISO: null, createdDate: null };
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return { createdISO: null, createdDate: null };
  }
  const iso = d.toISOString();
  const ymd = iso.slice(0, 10);
  return { createdISO: iso, createdDate: ymd };
};

/**
 * Lista DUCA (opcional ?estado=...).
 * Fechas siempre como STRING "YYYY-MM-DD" en todas las variantes.
 */
const getEstados = async (req, res) => {
  const estado = String(req.query.estado || "").toUpperCase().trim();

  const where  = ALLOWED.has(estado) ? `WHERE estado_documento = $1` : "";
  const params = ALLOWED.has(estado) ? [estado] : [];

  const sql = `
    SELECT
      numero_documento  AS numero_documento,
      estado_documento  AS estado_documento,
      fecha_emision     AS fecha_emision
    FROM duca
    ${where}
    ORDER BY fecha_emision DESC
    LIMIT 100;
  `;

  try {
    const { rows } = await query(sql, params);

    const out = rows.map(r => {
      const { createdISO, createdDate } = toDateStrings(r.fecha_emision);

      return {
        // Español
        numero: r.numero_documento,
        estado: r.estado_documento,
        creado: createdDate,          // ← STRING YYYY-MM-DD

        // Inglés
        number: r.numero_documento,
        status: r.estado_documento,
        created: createdDate,         // ← STRING YYYY-MM-DD

        // Variantes
        numero_documento: r.numero_documento,
        numeroDocumento: r.numero_documento,
        estado_documento: r.estado_documento,
        estadoDocumento: r.estado_documento,

        createdAt: createdDate,       // ← STRING YYYY-MM-DD
        created_at: createdDate,      // ← STRING YYYY-MM-DD
        fecha_emision: createdDate,   // ← STRING YYYY-MM-DD
        fechaEmision: createdDate,

        created_iso: createdISO
      };
    });

    res.json(out);
  } catch (e) {
    console.error("estados error:", e.message);
    res.json([]);
  }
};

router.get("/", getEstados);
router.get("/mis", getEstados);
router.get("/mis-declaraciones", getEstados);
router.get("/declaraciones", getEstados);
router.get("/list", getEstados);
router.get("*", getEstados);

export default router;
