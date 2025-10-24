// src/routes/duca.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * GET /duca/:numero
 * Devuelve el registro completo de la DUCA por su numero_documento.
 * Ajusta los nombres de columnas si en tu schema tienen otros nombres.
 */
router.get("/:numero", async (req, res) => {
  const numero = req.params.numero;

  // ⚠️ Ajusta esta SELECT con los nombres reales de tus columnas.
  // Debajo pongo lo más común según tu UI/formulario y capturas.
  const sql = `
    SELECT
      numero_documento              AS numero,
      fecha_emision                 AS fecha_emision,    -- DATE
      pais_emisor                   AS pais_emisor,
      moneda                        AS moneda,
      valor_aduana_total            AS valor_aduana_total,

      importador_nombre             AS importador_nombre,
      importador_documento          AS importador_documento,

      exportador_nombre             AS exportador_nombre,
      exportador_documento          AS exportador_documento,

      transporte_medio              AS transporte_medio,
      transporte_placa              AS transporte_placa,

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

    // Normalizamos fecha a string legible
    const d = r.fecha_emision ? new Date(r.fecha_emision) : null;
    const created_date = d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;

    // Devolvemos plano y también con alias por compatibilidad
    res.json({
      numero: r.numero,
      estado: r.estado,

      // fechas
      creado: created_date,
      created: created_date,
      createdAt: created_date,
      created_at: created_date,
      fecha_emision: created_date,
      fechaEmision: created_date,

      // generales
      pais_emisor: r.pais_emisor,
      moneda: r.moneda,
      valor_aduana_total: r.valor_aduana_total,

      // importador
      importador_nombre: r.importador_nombre,
      importador_documento: r.importador_documento,

      // exportador
      exportador_nombre: r.exportador_nombre,
      exportador_documento: r.exportador_documento,

      // transporte
      transporte_medio: r.transporte_medio,
      transporte_placa: r.transporte_placa
    });
  } catch (e) {
    console.error("duca detail error:", e.message);
    res.status(500).json({ error: true, message: "Error interno" });
    return;
  }
});

export default router;
