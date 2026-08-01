import * as analyticsService from "../services/analyticsService.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { startOfDay, endOfDay } from "../utils/dateHelpers.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getAdminStats = catchAsync(async (req, res) => {
  const [totalPatients, totalDoctors, todayAppointments, stats] =
    await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments({
        date: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) },
      }),
      analyticsService.getAdminStats(),
    ]);
  const monthlyRevenue = stats.revenueByMonth.at(-1)?.total ?? 0;
  res.json({
    totalPatients,
    totalDoctors,
    todayAppointments,
    monthlyRevenue,
    ...stats,
  });
});
