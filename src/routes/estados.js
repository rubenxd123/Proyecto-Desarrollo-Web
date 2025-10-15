import { Router } from 'express';
import { pool } from '../db.js';      // <-- ajusta a tu helper real
import { auth } from '../middlewares/auth.js'; // <-- si tienes middleware

const router = Router();

// ... tus endpoints existentes

// Detalle por número de documento
router.get('/:numero', auth, async (req, res) => {
  const numero = req.params.numero;

  // historial de estados
  const hq = `
    SELECT e.estado AS estado, e.motivo, e.creado_en, u.correo AS usuario
    FROM estados e
    LEFT JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.numero_documento = $1
    ORDER BY e.creado_en ASC
  `;
  // declaración DUCA
  const dq = `
    SELECT numero_documento, fecha_emision, pais_emisor, moneda, valor_aduana_total,
           importador, exportador, transporte, mercancias
    FROM duca
    WHERE numero_documento = $1
  `;

  const [historial, duca] = await Promise.all([
    pool.query(hq, [numero]),
    pool.query(dq, [numero])
  ]);

  const historialRows = historial.rows || [];
  const ducaRow = duca.rows[0] || null;

  return res.json({
    numero,
    estado: historialRows.at(-1)?.estado || 'DESCONOCIDO',
    historial: historialRows,
    duca: ducaRow
  });
});

export default router;
