import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Pendientes / En revisión
router.get("/pending", async (req, res) => {
  try {
    // TODO: ajusta a tu esquema real
    const { rows } = await query?.(
      "SELECT numero, estado, creado FROM declaraciones WHERE estado IN ('pendiente','revision') ORDER BY creado DESC LIMIT 50"
    ) ?? { rows: [] };
    res.json({ items: rows });
  } catch (e) {
    console.error("pending error:", e.message);
    res.json({ items: [] }); // no romper el frontend
  }
});

router.get("/review", async (req, res) => {
  try {
    const { rows } = await query?.(
      "SELECT numero, estado, creado FROM declaraciones WHERE estado = 'revision' ORDER BY creado DESC LIMIT 50"
    ) ?? { rows: [] };
    res.json({ items: rows });
  } catch (e) {
    console.error("review error:", e.message);
    res.json({ items: [] });
  }
});

export default router;
