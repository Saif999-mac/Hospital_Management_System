import Patient from "../models/Patient.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export const getPatients = async ({ page = 1, limit = 10, search = "" }) => {
  const query = search
    ? { name: { $regex: escapeRegex(search), $options: "i" } }
    : {};
  const patients = await Patient.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  const total = await Patient.countDocuments(query);
  return {
    patients,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

export const getPatientById = async (id) => {
  const patient = await Patient.findById(id);
  if (!patient) throw new AppError("Patient not Found", 404);
  return patient;
};

export const updatePatient = async (id, data) => {
  const patient = await Patient.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!patient) throw new AppError("Patient not found", 404);
  return patient;
};
export const getPatientByClerkId = async (clerkId) => {
  const patient = await Patient.findOne({ clerkId });
  if (!patient) throw new AppError("Patient profile not found", 404);
  return patient;
};
