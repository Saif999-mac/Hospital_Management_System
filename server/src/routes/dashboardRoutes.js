import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  getReceptionistDashboard,
  getPatientDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();
router.get(
  "/receptionist",
  requireAuth,
  requireRole("receptionist"),
  getReceptionistDashboard,
);
router.get(
  "/patient",
  requireAuth,
  requireRole("patient"),
  getPatientDashboard,
);

export default router;
