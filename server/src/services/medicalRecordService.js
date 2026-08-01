import MedicalRecord from "../models/MedicalRecord.js";
import { AppError } from "../utils/AppError.js";

export const createMedicalRecord = async (data) => {
  return MedicalRecord.create(data);
};
export const getMedicalRecordsByPatient = async (patientId) => {
  return MedicalRecord.find({ patient: patientId })
    .populate("doctor", "name specialization")
    .populate("patient", "name email phone")
    .sort({ visitDate: -1 });
};

export const softDeleteMedicalRecord = async (id) => {
  return MedicalRecord.findByIdAndUpdate(
    id,
    { deletedAt: new Date() },
    { new: true },
  );
};

export const getRecordsByDoctor = async (doctorId) =>
  MedicalRecord.find({ doctor: doctorId })
    .populate("patient", "name email")
    .sort({ visitDate: -1 });
