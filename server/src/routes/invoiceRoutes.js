import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { getInvoices, payInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

router.patch(
  "/:id/pay",
  requireAuth,
  requireRole("admin", "receptionist"),
  payInvoice,
);
router.get(
  "/",
  requireAuth,
  requireRole("admin", "receptionist", "patient"),
  getInvoices,
);

export default router;
