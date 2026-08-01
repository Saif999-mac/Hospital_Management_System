import * as appointmentService from "../services/appointmentService.js";
import Patient from "../models/Patient.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { startOfDay, endOfDay } from "../utils/dateHelpers.js";

// Book Appointment
export const createAppointment = catchAsync(async (req, res) => {
  const { doctorId, date, time, reason } = req.body;
  let patientId = req.body.patientId;
  if (req.user.role === "patient") {
    const patient = await Patient.findOne({ clerkId: req.user.clerkId });
    if (!patient) throw new AppError("Patient profile not found", 404);
    patientId = patient._id;
  } else if (!patientId) {
    throw new AppError(
      "patientId is required when booking on behalf of a patient",
      400,
    );
  }
  const bookedBy = req.user.role === "patient" ? "patient" : "receptionist";

  const appointment = await appointmentService.bookAppointment({
    patientId,
    doctorId,
    date,
    time,
    reason,
    bookedBy,
  });
  res.status(201).json(appointment);
});

// Get Appointments
export const getAppointments = catchAsync(async (req, res) => {
  const { role, clerkId } = req.user;
  let filter = {};

  if (role === "doctor") {
    const doctor = await Doctor.findOne({ clerkId });
    filter.doctor = doctor._id;
  } else if (role === "patient") {
    const patient = await Patient.findOne({ clerkId });
    filter.patient = patient._id;
  }
  // admin/receptionist see everything — no filter

  const appointments = await Appointment.find(filter)
    .populate("doctor", "name specialization")
    .populate("patient", "name phone")
    .sort({ date: 1, time: 1 });

  res.json(appointments);
});

// Update Appointment
export const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const updated = await appointmentService.updateAppointmentStatus(
    req.params.id,
    status,
    req.user.role,
  );
  res.json(updated);
});

// Get Todays Schedule
export const getTodaySchedule = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  const today = new Date();
  const appointments = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: startOfDay(today), $lte: endOfDay(today) },
    status: { $in: ["confirmed", "pending"] },
  })
    .populate("patient", "name phone dob gender")
    .sort({ time: 1 });
  res.json(appointments);
});

// Get my Patient
export const getMyPatients = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  const patients = await appointmentService.getDoctorsPatients(doctor._id);
  res.json(patients);
});
