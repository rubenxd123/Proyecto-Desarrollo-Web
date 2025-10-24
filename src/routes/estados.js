import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await query?.(
      "SELECT numero, estado, creado FROM declaraciones ORDER BY creado DESC LIMIT 100"
    ) ?? { rows: [] };
    res.json({ items: rows });
  } catch (e) {
    console.error("estados error:", e.message);
    res.json({ items: [] });
  }
});

export default router;
