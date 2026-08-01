import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  createPrescription,
  getPrescriptionsByPatient,
  getMyPrescriptions,
} from "../controllers/prescriptionController.js";

const router = express.Router();

router.get("/mine", requireAuth, requireRole("doctor"), getMyPrescriptions);
router.post("/", requireAuth, requireRole("doctor"), createPrescription);
router.get(
  "/patient/:patientId",
  requireAuth,
  requireRole("admin", "doctor", "patient"),
  getPrescriptionsByPatient,
);

export default router;
