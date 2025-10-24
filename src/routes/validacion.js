// src/routes/validacion.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

const getValidaciones = async (req, res) => {
  try {
    const { rows } = await query?.(
      "SELECT numero, estado, creado FROM declaraciones WHERE estado IN ('pendiente','revision') ORDER BY creado DESC LIMIT 50"
    ) ?? { rows: [] };
    res.json({ items: rows });
  } catch (e) {
    console.error("validacion error:", e.message);
    res.json({ items: [] });
  }
};

// alias típicos que suelen usar los frontends
router.get("/", getValidaciones);
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);

export default router;
