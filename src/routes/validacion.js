// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const toDateStrings = (dateVal) => {
  if (!dateVal) {
    return { createdISO: null, createdDate: null };
  }
  // Aseguramos que sea un objeto Date válido
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return { createdISO: null, createdDate: null };
  }
  const iso = d.toISOString();        // 2025-10-15T00:00:00.000Z
  const ymd = iso.slice(0, 10);       // 2025-10-15
  return { createdISO: iso, createdDate: ymd };
};

/**
 * DUCA en PENDIENTE o EN_REVISION.
 * Devuelve claves ES/EN y las fechas como STRING "YYYY-MM-DD"
 * en: creado, created, createdAt, created_at, fecha_emision, fechaEmision.
 */
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

        // Extras por si el front imprime ISO directamente
        created_iso: createdISO
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
router.get("*", getValidaciones);

export default router;
