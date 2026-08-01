import Appointment from "../models/Appointment.js";
import { AppError } from "../utils/AppError.js";

export const canDoctorAccessPatient = async (doctorId, patientId) => {
  const hasHistory = await Appointment.exists({
    doctor: doctorId,
    patient: patientId,
  });
  if (!hasHistory)
    throw new AppError("No treatment relationship with this patient", 403);
};
