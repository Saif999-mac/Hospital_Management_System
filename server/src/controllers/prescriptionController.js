import * as prescriptionService from "../services/prescriptionService.js";
import { canDoctorAccessPatient } from "../services/accessControlService.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../utils/notifications.js";

// Create Prescription
export const createPrescription = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  if (!doctor) throw new AppError("Doctor profile not found", 404);

  const { medicalRecordId, patientId, medicines } = req.body;
  await canDoctorAccessPatient(doctor._id, patientId);

  const prescription = await prescriptionService.createPrescription({
    medicalRecord: medicalRecordId,
    patient: patientId,
    doctor: doctor._id,
    medicines,
  });
  const patient = await Patient.findById(patientId);
  createNotification({
    recipientClerkId: patient.clerkId,
    type: "prescription",
    title: "New Prescription",
    message: `Dr. ${doctor.name} has issued a new prescription for you.`,
    relatedId: prescription._id,
  }).catch(console.error);

  res.status(201).json(prescription);
});

// Get Prescription
export const getPrescriptionsByPatient = catchAsync(async (req, res) => {
  const { role, clerkId } = req.user;
  const { patientId } = req.params;

  if (role === "patient") {
    const patient = await Patient.findOne({ clerkId });
    if (!patient || patient._id.toString() !== patientId) {
      throw new AppError(
        "Forbidden: you can only view your own prescriptions",
        403,
      );
    }
  } else if (role === "doctor") {
    const doctor = await Doctor.findOne({ clerkId });
    await canDoctorAccessPatient(doctor._id, patientId);
  }
  // admin: read access, no ownership restriction

  const prescriptions =
    await prescriptionService.getPrescriptionsByPatient(patientId);
  res.json(prescriptions);
});

// By Doctor
export const getMyPrescriptions = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  const prescriptions = await prescriptionService.getPrescriptionsByDoctor(
    doctor._id,
  );
  res.json(prescriptions);
});
