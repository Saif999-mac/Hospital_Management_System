import * as doctorService from "../services/doctorService.js";
import { clerkClient } from "../config/clerkClient.js";
import { catchAsync } from "../utils/catchAsync.js";

export const inviteDoctor = catchAsync(async (req, res) => {
  const { name, email, specialization, consultationFee, department } = req.body;
  const invitation = await clerkClient.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: {
      role: "doctor",
      name,
      specialization,
      consultationFee,
      department,
    },
    redirectUrl: `${process.env.CLIENT_URL}/sign-up`,
  });
  res.status(201).json({ invitation });
});

export const getDoctors = catchAsync(async (req, res) => {
  const doctors = await doctorService.getDoctors();
  res.json(doctors);
});

// Get Doctors
export const getMyDoctorProfile = catchAsync(async (req, res) => {
  const doctor = await doctorService.getDoctorByClerkId(req.user.clerkId);
  res.json(doctor);
});
