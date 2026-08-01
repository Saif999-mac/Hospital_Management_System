import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientClerkId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["appointment", "prescription", "invoice", "system"],
      required: true,
    },
    title: String,
    message: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);
