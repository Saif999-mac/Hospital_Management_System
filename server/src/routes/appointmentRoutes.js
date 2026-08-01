import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  createAppointment,
  getAppointments,
  updateStatus,
  getTodaySchedule,
  getMyPatients,
} from "../controllers/appointmentController.js";
import { bookingLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/today", requireAuth, requireRole("doctor"), getTodaySchedule);
router.get("/my-patients", requireAuth, requireRole("doctor"), getMyPatients);
router.get(
  "/",
  requireAuth,
  requireRole("admin", "doctor", "receptionist", "patient"),
  getAppointments,
);
router.post(
  "/",
  requireAuth,
  requireRole("patient", "receptionist", "admin"),
  bookingLimiter,
  createAppointment,
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin", "doctor", "receptionist", "patient"),
  updateStatus,
);

export default router;
