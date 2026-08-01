import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { upload } from "../middleware/upload.js";
import {
  createMedicalRecord,
  getMedicalRecordsByPatient,
  getMyMedicalRecords,
} from "../controllers/medicalRecordController.js";

const router = express.Router();

router.get("/mine", requireAuth, requireRole("doctor"), getMyMedicalRecords);

router.post(
  "/",
  requireAuth,
  requireRole("doctor"),
  upload.single("attachment"),
  createMedicalRecord,
);
router.get(
  "/patient/:patientId",
  requireAuth,
  requireRole("admin", "doctor", "patient"),
  getMedicalRecordsByPatient,
);

export default router;
