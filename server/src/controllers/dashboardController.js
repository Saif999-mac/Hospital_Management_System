import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Prescription from "../models/Prescription.js";
import { startOfDay, endOfDay } from "../utils/dateHelpers.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getReceptionistDashboard = catchAsync(async (req, res) => {
  const today = new Date();
  const [appointments, pendingInvoices] = await Promise.all([
    Appointment.find({
      date: { $gte: startOfDay(today), $lte: endOfDay(today) },
      status: { $ne: "cancelled" },
    })
      .populate("doctor", "name")
      .populate("patient", "name")
      .sort({ time: 1 }),
    Invoice.countDocuments({ status: "unpaid" }),
  ]);

  const checkedIn = appointments.filter((a) => a.status === "confirmed").length;

  res.json({
    todayCount: appointments.length,
    pendingInvoices,
    checkedIn,
    appointments,
  });
});

export const getPatientDashboard = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ clerkId: req.user.clerkId });
  const [upcomingAppointment, outstandingInvoice, recentPrescriptions] =
    await Promise.all([
      Appointment.findOne({
        patient: patient._id,
        date: { $gte: new Date() },
        status: { $in: ["pending", "confirmed"] },
      })
        .sort({ date: 1 })
        .populate("doctor", "name"),
      Invoice.findOne({ patient: patient._id, status: "unpaid" }),
      Prescription.find({ patient: patient._id })
        .sort({ issuedDate: -1 })
        .limit(5),
    ]);
  res.json({ upcomingAppointment, outstandingInvoice, recentPrescriptions });
});
