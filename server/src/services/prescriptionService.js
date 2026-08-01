import Prescription from "../models/Prescription.js";

// Create Prescription
export const createPrescription = async (data) => Prescription.create(data);

// Get Prescription For Patient
export const getPrescriptionsByPatient = async (patientId) =>
  Prescription.find({ patient: patientId })
    .populate("doctor", "name specialization")
    .sort({ issuedDate: -1 });

export const getPrescriptionsByDoctor = async (doctorId) =>
  Prescription.find({ doctor: doctorId })
    .populate("patient", "name email")
    .sort({ issuedDate: -1 });
