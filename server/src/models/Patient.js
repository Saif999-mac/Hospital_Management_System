import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    dob: Date,
    gender: { type: String, enum: ["male", "female", "others"] },
    bloodGroup: String,
    address: String,
    emergencyContact: { name: String, phone: String },
    allergies: [String],
    avatarUrl: String,
  },
  { timestamps: true },
);
export default mongoose.model("Patient", patientSchema);
