import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import Patient from "./models/Patient.js";
import Doctor from "./models/Doctor.js";
import Receptionist from "./models/Receptionist.js";
import Admin from "./models/Admin.js";

const seed = async () => {
  await connectDB();
  const patient = await Patient.create({
    clerkId: "seed_patient_1",
    name: "Test Patient",
    email: "patient@test.com",
    phone: "555-0100",
    dob: new Date("1995-06-15"),
    gender: "male",
    bloodGroup: "O+",
  });
  const doctor = await Doctor.create({
    clerkId: "seed_doctor_1",
    name: "Dr. Test Doctor",
    email: "doctor@test.com",
    specialization: "Cardiology",
    qualifications: ["MBBS", "MD"],
    experienceYears: 8,
    consultationFee: 800,
    department: "Cardiology",
  });
  const receptionist = await Receptionist.create({
    clerkId: "seed_receptionist_1",
    name: "Test Receptionist",
    email: "receptionist@test.com",
    assignedDepartment: "Front Desk",
    shift: "morning",
  });

  const admin = await Admin.create({
    clerkId: "seed_admin_1",
    name: "Test Admin",
    email: "admin@test.com",
  });

  await Admin.create({
    clerkId: "user_3GaDRypFzBF3vRiZeOqDuPpZPHI", // paste your actual doctor test account's Clerk ID here
    name: "Saif Ahmed",
    email: "saifahmedprince001@gmail.com",
  });

  await Doctor.create({
    clerkId: "user_3Gr9bIpVlkr0Pl1hIYNUxZzJSpT", // paste your actual doctor test account's Clerk ID here
    name: "Dr. Test Doctor",
    email: "saifahmedprince001+doctor1@gmail.com",
    specialization: "Neurologist",
    consultationFee: 800,
    department: "Neurology",
  });

  await Receptionist.create({
    clerkId: "user_3Gr9tXjpU322XD7Kw8kQhBaDlAj",
    name: "Test Receptionist",
    email: "saifahmedprince001+receptionist1@gmail.com",
    assignedDepartment: "Front Desk",
  });

  console.log("Seeded:", {
    patient: patient._id,
    doctor: doctor._id,
    receptionist: receptionist._id,
    admin: admin._id,
  });
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
