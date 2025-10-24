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

// Ruta base
router.get("/", getValidaciones);

// Alias típicos
router.get("/pendientes", getValidaciones);
router.get("/en-revision", getValidaciones);

// Fallback para cualquier subruta
router.get("*", getValidaciones);

export default router;
