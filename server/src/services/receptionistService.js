import Receptionist from "../models/Receptionist.js";

export const getReceptionists = async () => {
  return Receptionist.find({ isActive: true }).sort({ createdAt: -1 });
};
