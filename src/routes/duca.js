// src/routes/duca.js
import { Router } from "express";
const router = Router();

// Pendientes / en revisión (la UI que te falla)
router.get("/pending", async (req, res) => {
  // TODO: remplazar con consulta a BD
  res.json({ items: [] });
});

router.get("/review", async (req, res) => {
  res.json({ items: [] });
});

export default router;
