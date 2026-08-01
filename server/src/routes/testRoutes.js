import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.get("/test-protected", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "You are authenticated as admin", user: req.user });
});

export default router;
