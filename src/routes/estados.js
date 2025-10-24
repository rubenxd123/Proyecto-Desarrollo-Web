// src/routes/estados.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const ALLOWED = new Set(["PENDIENTE","EN_REVISION","VALIDADA","RECHAZADA","ANULADA"]);

/**
 * Lista de DUCA (con ?estado=...) y claves es/EN + fecha ISO.
 * Responde array de objetos:
 *  { numero, estado, creado, number, status, created }
 */
const getEstados = async (req, res) => {
  const estado = String(req.query.estado || "").toUpperCase().trim();

  const where = ALLOWED.has(estado) ? `WHERE estado_documento = $1` : "";
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
      const createdISO = r.fecha_emision
        ? new Date(r.fecha_emision).toISOString().slice(0, 10)
        : null;

      return {
        // español
        numero: r.numero_documento,
        estado: r.estado_documento,
        creado: createdISO,
        // inglés
        number: r.numero_documento,
        status: r.estado_documento,
        created: createdISO
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
