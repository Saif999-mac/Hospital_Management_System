import Notification from "../models/Notification.js";
import { AppError } from "../utils/AppError.js";

export const getNotifications = async (clerkId) =>
  Notification.find({ recipientClerkId: clerkId })
    .sort({ createdAt: -1 })
    .limit(50);

export const getUnreadCount = async (clerkId) =>
  Notification.countDocuments({ recipientClerkId: clerkId, isRead: false });

export const markAsRead = async (id, clerkId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientClerkId: clerkId }, // scoped to the requester — can't mark someone else's as read
    { isRead: true },
    { new: true },
  );
  if (!notification) throw new AppError("Notification not found", 404);
  return notification;
};
