// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * DUCA en PENDIENTE o EN_REVISION
 * Devuelve ambas variantes de claves:
 *   { numero, estado, creado, number, status, created }
 * y created/creado en ISO: "YYYY-MM-DD".
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
    const { rows } = await query(sql, []);

    const out = rows.map(r => {
      // fecha_emision es DATE; formateamos a ISO YYYY-MM-DD
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
    console.error("validacion error:", e.message);
    res.json([]); // no rompemos el front
  }
};

router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);
router.get("*", getValidaciones);

export default router;
