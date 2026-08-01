import * as patientService from "../services/patientService.js";
import Patient from "../models/Patient.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getPatients = catchAsync(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await patientService.getPatients({ page, limit, search });
  res.json(result);
});

export const getPatientById = catchAsync(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);
  if (req.user.role === "patient" && patient.clerkId !== req.user.clerkId) {
    throw new AppError("Forbidden: you can only view your own record", 403);
  }
  res.json(patient);
});

export const updatePatient = catchAsync(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new AppError("Patient not found", 404);

  if (req.user.role === "patient" && patient.clerkId !== req.user.clerkId) {
    throw new AppError("Forbidden: you can only update your own record", 403);
  }

  const updated = await patientService.updatePatient(req.params.id, req.body);
  res.json(updated);
});

// Me Profile
export const getMyProfile = catchAsync(async (req, res) => {
  const patient = await patientService.getPatientByClerkId(req.user.clerkId);
  res.json(patient);
});

export const updateMyProfile = catchAsync(async (req, res) => {
  const patient = await patientService.getPatientByClerkId(req.user.clerkId);
  const updated = await patientService.updatePatient(patient._id, req.body);
  res.json(updated);
});
