// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const ALLOWED = new Set(["PENDIENTE","EN_REVISION","VALIDADA","RECHAZADA","ANULADA"]);

/**
 * Lista DUCA (opcional ?estado=...).
 * Devuelve las mismas variantes que /validacion para asegurar compatibilidad.
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
      const d = r.fecha_emision ? new Date(r.fecha_emision) : null;
      const created_ms   = d ? d.getTime() : null;
      const created_iso  = d ? d.toISOString() : null;
      const created_date = d ? created_iso.slice(0, 10) : null;

      return {
        // Español
        numero: r.numero_documento,
        estado: r.estado_documento,
        creado: created_ms,

        // Inglés
        number: r.numero_documento,
        status: r.estado_documento,
        created: created_ms,

        // Variantes
        numero_documento: r.numero_documento,
        numeroDocumento: r.numero_documento,
        estado_documento: r.estado_documento,
        estadoDocumento: r.estado_documento,

        createdAt: created_ms,
        created_at: created_ms,
        fecha_emision: r.fecha_emision,
        fechaEmision: r.fecha_emision,

        // Extras
        created_iso,
        created_date
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
