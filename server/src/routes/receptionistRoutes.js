import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  inviteReceptionist,
  getReceptionists,
} from "../controllers/receptionistController.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), getReceptionists);
router.post("/invite", requireAuth, requireRole("admin"), inviteReceptionist);

export default router;
