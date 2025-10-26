// src/routes/duca.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/* ---------- Helpers ---------- */
function pick(v, ...names) {
  for (const n of names) if (v && v[n] !== undefined) return v[n];
  return undefined;
}

function normalize(body = {}) {
  // aceptamos camelCase o snake_case desde el front
  const numero_documento   = pick(body, "numero_documento", "numeroDocumento", "numero");
  const fecha_emision      = pick(body, "fecha_emision", "fechaEmision");
  const pais_emisor        = pick(body, "pais_emisor", "paisEmisor");
  const moneda             = body.moneda;
  const valor_aduana_total = Number(pick(body, "valor_aduana_total", "valorAduanaTotal"));

  const importador = body.importador ?? {};
  const exportador = body.exportador ?? {};
  const transporte = body.transporte ?? {};
  const mercancias = body.mercancias ?? null; // opcional

  return {
    numero_documento,
    fecha_emision,
    pais_emisor,
    moneda,
    valor_aduana_total,
    importador,
    exportador,
    transporte,
    mercancias,
  };
}

function validate(p) {
  const errs = [];
  if (!p.numero_documento) errs.push("numero_documento es requerido");
  if (!p.fecha_emision)    errs.push("fecha_emision es requerida");
  if (!p.pais_emisor)      errs.push("pais_emisor es requerido");
  if (!p.moneda)           errs.push("moneda es requerida");
  if (!Number.isFinite(p.valor_aduana_total)) errs.push("valor_aduana_total inválido");
  return errs;
}

/* ---------- POST /duca (registrar) ---------- */
router.post("/", async (req, res) => {
  const p = normalize(req.body);
  const errors = validate(p);
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const dup = await query("select 1 from duca where numero_documento=$1", [p.numero_documento]);
  if (dup.rowCount) return res.status(409).json({ error: "Ya existe ese número de DUCA" });

  const sql = `
    insert into duca(
      numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
      importador, exportador, transporte, mercancias, estado_documento
    ) values (
      $1, $2, $3, $4, $5,
      $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, 'PENDIENTE'
    )
    returning id, numero_documento, fecha_emision, estado_documento
  `;
  const vals = [
    p.numero_documento,
    p.fecha_emision,         // YYYY-MM-DD
    p.pais_emisor,
    p.moneda,
    p.valor_aduana_total,
    JSON.stringify(p.importador),
    JSON.stringify(p.exportador),
    JSON.stringify(p.transporte),
    p.mercancias ? JSON.stringify(p.mercancias) : null,
  ];

  const r = await query(sql, vals);
  return res.status(201).json(r.rows[0]);
});

/* ---------- GET /duca/estados ---------- */
router.get("/estados", async (_req, res) => {
  const r = await query(`
    select
      numero_documento as numero,
      estado_documento as estado,
      to_char(fecha_emision,'DD/MM/YYYY') as creado
    from duca
    order by fecha_emision desc, numero_documento desc
  `);
  res.json(r.rows);
});

/* ---------- GET /duca/:numero ---------- */
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
    const d = r.fecha_emision ? new Date(r.fecha_emision) : null;
    const fechaISO = d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : r.fecha_emision;

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
