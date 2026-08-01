import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    specialization: { type: String, required: true },
    qualifications: [String],
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, required: true },
    department: { type: String, required: true },
    avatarUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("Doctor", doctorSchema);
