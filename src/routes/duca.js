import { Router } from "express";
const router = Router();

// Pendientes / En revisión (pantalla que te daba error)
router.get("/pending", async (req, res) => {
  res.json({ items: [] });
});

router.get("/review", async (req, res) => {
  res.json({ items: [] });
});

export default router;
