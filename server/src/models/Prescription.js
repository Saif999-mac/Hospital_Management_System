import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalRecord",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: String, // "500mg"
        frequency: String, // "twice daily"
        duration: String, // "5 days"
        instructions: String, // "after food"
      },
    ],
    issuedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true },
);
export default mongoose.model("Prescription", prescriptionSchema);
