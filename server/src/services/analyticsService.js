import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";

export const getAdminStats = async () => {
  const [appointmentsByStatus, revenueByMonth, topDoctors] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Invoice.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Appointment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      { $project: { "doctor.name": 1, "doctor.specialization": 1, count: 1 } },
    ]),
  ]);
  return { appointmentsByStatus, revenueByMonth, topDoctors };
};
