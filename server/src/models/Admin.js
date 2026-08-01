import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    permissions: {
      type: [String],
      default: ["manage_users", "manage_billing", "view_analytics"],
    },
  },
  { timestamps: true },
);
export default mongoose.model("Admin", adminSchema);
