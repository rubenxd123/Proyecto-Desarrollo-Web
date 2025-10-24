// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * DUCA en PENDIENTE o EN_REVISION.
 * Devuelve objetos con TODAS las variantes de claves:
 *  - numero, number, numero_documento, numeroDocumento
 *  - estado, status, estado_documento, estadoDocumento
 *  - creado, created, createdAt, created_at, fecha_emision, fechaEmision
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
      // fecha_emision viene como DATE -> forzamos ISO y duplicamos en varias claves
      const iso = r.fecha_emision
        ? new Date(r.fecha_emision).toISOString() // 2025-10-21T00:00:00.000Z
        : null;

      return {
        // español
        numero: r.numero_documento,
        estado: r.estado_documento,
        creado: iso,

        // inglés
        number: r.numero_documento,
        status: r.estado_documento,
        created: iso,

        // variantes comunes camel/snake
        numero_documento: r.numero_documento,
        numeroDocumento: r.numero_documento,
        estado_documento: r.estado_documento,
        estadoDocumento: r.estado_documento,

        createdAt: iso,
        created_at: iso,
        fecha_emision: r.fecha_emision,           // DATE puro (por si el front lo pinta tal cual)
        fechaEmision: r.fecha_emision
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
