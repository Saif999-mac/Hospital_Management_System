import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipientClerkId,
  type,
  title,
  message,
  relatedId,
}) => {
  await Notification.create({
    recipientClerkId,
    type,
    title,
    message,
    relatedId,
  });
};
