import * as medicalRecordService from "../services/medicalRecordService.js";
import { canDoctorAccessPatient } from "../services/accessControlService.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { uploadToCloudinary } from "../middleware/upload.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

export const createMedicalRecord = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  if (!doctor) throw new AppError("Doctor profile not found", 404);

  const { patientId, appointmentId, symptoms, diagnosis, notes, vitals } =
    req.body;

  await canDoctorAccessPatient(doctor._id, patientId);

  let attachments = [];
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "medical-records");
    attachments = [
      {
        url: result.secure_url,
        publicId: result.public_id,
        label: req.file.originalname,
      },
    ];
  }
  const record = await medicalRecordService.createMedicalRecord({
    patient: patientId,
    doctor: doctor._id,
    appointment: appointmentId || undefined,
    symptoms: symptoms ? JSON.parse(symptoms) : [],
    diagnosis,
    notes,
    vitals: vitals ? JSON.parse(vitals) : undefined,
    attachments,
  });

  res.status(201).json(record);
});

export const getMedicalRecordsByPatient = catchAsync(async (req, res) => {
  const { role, clerkId } = req.user;
  const { patientId } = req.params;

  if (role === "patient") {
    const patient = await Patient.findOne({ clerkId });
    if (!patient || patient._id.toString() !== patientId) {
      throw new AppError(
        "Forbidden: you can only view your own medical records",
        403,
      );
    }
  } else if (role === "doctor") {
    const doctor = await Doctor.findOne({ clerkId });
    await canDoctorAccessPatient(doctor._id, patientId);
  }
  const records =
    await medicalRecordService.getMedicalRecordsByPatient(patientId);
  res.json(records);
});

export const getMyMedicalRecords = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  const records = await medicalRecordService.getRecordsByDoctor(doctor._id);
  res.json(records);
});
