import mongoose from "mongoose";

const receptionistSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    assignedDepartment: { type: String, default: "General" },
    shift: {
      type: String,
      enum: ["morning", "evening", "night"],
      default: "morning",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("Receptionist", receptionistSchema);
