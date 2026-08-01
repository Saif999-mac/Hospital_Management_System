import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", requireAuth, getMyNotifications);
router.get("/unread-count", requireAuth, getUnreadCount);
router.patch("/:id/read", requireAuth, markAsRead);

export default router;
