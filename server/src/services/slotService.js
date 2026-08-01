import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import { startOfDay, endOfDay } from "../utils/dateHelpers.js";

export const getAvailableSlots = async (doctorId, dateStr) => {
  const date = new Date(dateStr);
  const dayName = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    date.getDay()
  ];

  const availability = await Availability.findOne({ doctor: doctorId });
  if (!availability) return [];

  const isOnLeave = availability.leaveDates.some(
    (d) => d.toDateString() === date.toDateString(),
  );
  if (isOnLeave) return [];

  const daySchedule = availability.weeklySchedule.find(
    (s) => s.day === dayName,
  );
  if (!daySchedule) return [];

  const slots = generateSlots(
    daySchedule.startTime,
    daySchedule.endTime,
    daySchedule.slotDurationMins,
  );

  const booked = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    status: { $ne: "cancelled" },
  }).select("time");

  const bookedTimes = new Set(booked.map((a) => a.time));
  return slots.filter((s) => !bookedTimes.has(s));
};

function generateSlots(start, end, durationMins) {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  while (h < endH || (h === endH && m < endM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += durationMins;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m %= 60;
    }
  }
  return slots;
}
