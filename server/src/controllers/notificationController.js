import * as notificationService from "../services/notificationService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.getNotifications(
    req.user.clerkId,
  );
  res.json(notifications);
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.clerkId);
  res.json({ count });
});

export const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user.clerkId,
  );
  res.json(notification);
});
