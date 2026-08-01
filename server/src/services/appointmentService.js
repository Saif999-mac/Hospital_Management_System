import Appointment from "../models/Appointment.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../utils/notifications.js";
import { generateInvoiceForAppointment } from "./invoiceService.js";
import Patient from "../models/Patient.js";

export const bookAppointment = async ({
  patientId,
  doctorId,
  date,
  time,
  reason,
  bookedBy,
}) => {
  try {
    return await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date,
      time,
      reason,
      bookedBy,
    });
  } catch (err) {
    if (err.code === 11000)
      throw new AppError(
        "This slot was just booked by someone else. Please pick another.",
        409,
      );
    throw err;
  }
};

const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no-show"],
  completed: [],
  cancelled: [],
  "no-show": [],
};

export const updateAppointmentStatus = async (id, newStatus, actorRole) => {
  const appt = await Appointment.findById(id)
    .populate("patient")
    .populate("doctor");
  if (!appt) throw new AppError("Appointment not found", 404);

  if (!VALID_TRANSITIONS[appt.status].includes(newStatus)) {
    throw new AppError(
      `Cannot move appointment from ${appt.status} to ${newStatus}`,
      400,
    );
  }
  if (
    newStatus === "completed" &&
    actorRole !== "doctor" &&
    actorRole !== "admin"
  ) {
    throw new AppError("Only a doctor can mark an appointment completed", 403);
  }
  appt.status = newStatus;
  await appt.save();

  createNotification({
    recipientClerkId: appt.patient.clerkId,
    type: "appointment",
    title: `Appointment ${newStatus}`,
    message: `Your appointment with Dr. ${appt.doctor.name} on ${appt.date.toDateString()} at ${appt.time} is now ${newStatus}.`,
    relatedId: appt._id,
  }).catch(console.error);

  if (newStatus === "completed") {
    await generateInvoiceForAppointment(appt).catch(console.error);
  }
  return appt;
};

export const getDoctorsPatients = async (doctorId) => {
  const patientIds = await Appointment.distinct("patient", {
    doctor: doctorId,
  });
  return Patient.find({ _id: { $in: patientIds } }).sort({ name: 1 });
};
