import { Router } from "express";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/hash-test", async (req, res, next) => {
  try {
    const plain = req.body?.password || "test";
    const hash = await bcrypt.hash(plain, 10);
    const ok = await bcrypt.compare(plain, hash);
    res.json({ hash, ok });
  } catch (e) { next(e); }
});

export default router;
