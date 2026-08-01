import Doctor from "../models/Doctor.js";
import { AppError } from "../utils/AppError.js";

export const getDoctors = async () => {
  return Doctor.find({ isActive: true }).sort({ createdAt: -1 });
};

export const getDoctorByClerkId = async (clerkId) => {
  const doctor = await Doctor.findOne({ clerkId });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor;
};
