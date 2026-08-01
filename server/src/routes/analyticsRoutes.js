import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { getAdminStats } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/admin", requireAuth, requireRole("admin"), getAdminStats);

export default router;
