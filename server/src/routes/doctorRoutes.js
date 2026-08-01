import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  inviteDoctor,
  getDoctors,
  getMyDoctorProfile,
} from "../controllers/doctorController.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("doctor"), getMyDoctorProfile);
router.get("/", requireAuth, getDoctors);
router.post("/invite", requireAuth, requireRole("admin"), inviteDoctor);

export default router;
