import Invoice from "../models/Invoice.js";
import Doctor from "../models/Doctor.js";
import { AppError } from "../utils/AppError.js";

// Generate Invoice
export const generateInvoiceForAppointment = async (appointment) => {
  const doctor = await Doctor.findById(appointment.doctor);
  return Invoice.create({
    patient: appointment.patient,
    appointment: appointment._id,
    items: [
      {
        description: `Consultation — ${doctor.specialization}`,
        amount: doctor.consultationFee,
      },
    ],
    tax: Math.round(doctor.consultationFee * 0.05), // example 5% tax
  });
};

// Get Invoice
export const getInvoices = async ({ role, patientObjectId, appointmentId }) => {
  const filter = {};
  if (role === "patient") filter.patient = patientObjectId;
  if (appointmentId) filter.appointment = appointmentId;

  return Invoice.find(filter)
    .populate("patient", "name email")
    .populate("appointment", "date time")
    .sort({ createdAt: -1 });
};

// Mark Paid
export const markAsPaid = async (id, paymentMethod) => {
  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { status: "paid", paymentMethod, paidAt: new Date() },
    { new: true, runValidators: true },
  );
  if (!invoice) throw new AppError("Invoice not found", 404);
  return invoice;
};

// Delete
export const softDeleteInvoice = async (id) => {
  return Invoice.findByIdAndUpdate(
    id,
    { deletedAt: new Date() },
    { new: true },
  );
};
