import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  setAvailability,
  getSlots,
} from "../controllers/availabilityController.js";

const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, getSlots);
router.post("/", requireAuth, requireRole("doctor", "admin"), setAvailability);

export default router;
