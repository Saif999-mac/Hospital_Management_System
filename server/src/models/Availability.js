import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    unique: true,
  },
  weeklySchedule: [
    {
      day: {
        type: String,
        enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      },
      startTime: String,
      endTime: String,
      slotDurationMins: { type: Number, default: 20 },
    },
  ],
  leaveDates: [Date],
});

export default mongoose.model("Availability", availabilitySchema);
