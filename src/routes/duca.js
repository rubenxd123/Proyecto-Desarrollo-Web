// src/routes/duca.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * GET /duca/:numero
 * Devuelve los campos exactos de la tabla DUCA:
 *  - numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
 *    importador, exportador, transporte, estado_documento
 */
router.get("/:numero", async (req, res) => {
  const numero = req.params.numero;

  const sql = `
    SELECT
      numero_documento              AS numero,
      fecha_emision                 AS fecha_emision,
      pais_emisor                   AS pais_emisor,
      moneda                        AS moneda,
      valor_aduana_total            AS valor_aduana_total,
      importador                    AS importador,
      exportador                    AS exportador,
      transporte                    AS transporte,
      estado_documento              AS estado
    FROM duca
    WHERE numero_documento = $1
    LIMIT 1;
  `;

  try {
    const { rows } = await query(sql, [numero]);
    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: "No encontrado" });
    }

    const r = rows[0];
    // Normalizamos fecha a YYYY-MM-DD si es válida
    const d = r.fecha_emision ? new Date(r.fecha_emision) : null;
    const fechaISO =
      d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : r.fecha_emision;

    res.json({
      numero: r.numero,
      estado: r.estado,
      fecha_emision: fechaISO,
      pais_emisor: r.pais_emisor,
      moneda: r.moneda,
      valor_aduana_total: r.valor_aduana_total,
      importador: r.importador,
      exportador: r.exportador,
      transporte: r.transporte
    });
  } catch (e) {
    console.error("duca detail error:", e?.message || e);
    res.status(500).json({ error: true, message: "Error interno" });
  }
});

export default router;
