import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { updatePatientSchema } from "../validators/patientValidator.js";
import {
  getPatients,
  getPatientById,
  updatePatient,
  getMyProfile,
  updateMyProfile,
} from "../controllers/patientController.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("patient"), getMyProfile);
router.patch(
  "/me",
  requireAuth,
  requireRole("patient"),
  validate(updatePatientSchema),
  updateMyProfile,
);

router.get("/", requireAuth, requireRole("admin", "receptionist"), getPatients);
router.get(
  "/:id",
  requireAuth,
  requireRole("admin", "receptionist", "doctor", "patient"),
  getPatientById,
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "receptionist", "patient"),
  validate(updatePatientSchema),
  updatePatient,
);
export default router;
