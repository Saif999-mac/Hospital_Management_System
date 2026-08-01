import * as receptionistService from "../services/receptionistService.js";
import { clerkClient } from "../config/clerkClient.js";
import { catchAsync } from "../utils/catchAsync.js";

export const inviteReceptionist = catchAsync(async (req, res) => {
  const { name, email, assignedDepartment, shift } = req.body;
  const invitation = await clerkClient.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: "receptionist", name, assignedDepartment, shift },
    redirectUrl: `${process.env.CLIENT_URL}/sign-up`,
  });
  res.status(201).json({ invitation });
});

export const getReceptionists = catchAsync(async (req, res) => {
  const receptionists = await receptionistService.getReceptionists();
  res.json(receptionists);
});
