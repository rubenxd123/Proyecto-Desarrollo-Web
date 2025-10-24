// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * DUCA en PENDIENTE o EN_REVISION.
 * Devuelve claves en ES/EN y fechas en:
 *  - ISO completo           (created_iso)
 *  - YYYY-MM-DD             (created_date)
 *  - timestamp ms (number)  (created_ms)
 * Además duplica en: creado/created/createdAt/created_at/fecha_emision/fechaEmision
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
      const d = r.fecha_emision ? new Date(r.fecha_emision) : null;
      const created_ms   = d ? d.getTime() : null;               // ← seguro para new Date(ms)
      const created_iso  = d ? d.toISOString() : null;
      const created_date = d ? created_iso.slice(0, 10) : null;  // YYYY-MM-DD

      return {
        // Español
        numero: r.numero_documento,
        estado: r.estado_documento,
        creado: created_ms,

        // Inglés
        number: r.numero_documento,
        status: r.estado_documento,
        created: created_ms,

        // Variantes comunes
        numero_documento: r.numero_documento,
        numeroDocumento: r.numero_documento,
        estado_documento: r.estado_documento,
        estadoDocumento: r.estado_documento,

        createdAt: created_ms,
        created_at: created_ms,
        fecha_emision: r.fecha_emision,
        fechaEmision: r.fecha_emision,

        // Extras explícitos por si el front solo imprime strings
        created_iso,
        created_date
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
