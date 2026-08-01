import Availability from "../models/Availability.js";
import { getAvailableSlots } from "../services/slotService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

export const setAvailability = catchAsync(async (req, res) => {
  const { weeklySchedule, leaveDates } = req.body;
  const availability = await Availability.findOneAndUpdate(
    { doctor: req.params.id },
    { weeklySchedule, leaveDates },
    { new: true, upsert: true, runValidators: true },
  );
  res.status(200).json(availability);
});

export const getSlots = catchAsync(async (req, res) => {
  const { date } = req.query;
  if (!date)
    throw new AppError(
      "A 'date' query parameter is required, e.g. ?date=2026-08-01",
      400,
    );
  const slots = await getAvailableSlots(req.params.id, date);
  res.json({ date, slots });
});
