import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
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
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    visitDate: { type: Date, default: Date.now },
    symptoms: [String],
    diagnosis: { type: String, required: true },
    notes: String,
    vitals: {
      bloodPressure: String,
      temperature: Number,
      pulse: Number,
      weight: Number,
      height: Number,
    },
    attachments: [{ url: String, publicId: String, label: String }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
medicalRecordSchema.pre(/^find/, function (next) {
  this.where({ deletedAt: null });
});

export default mongoose.model("MedicalRecord", medicalRecordSchema);
