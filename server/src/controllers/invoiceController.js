import * as invoiceService from "../services/invoiceService.js";
import Patient from "../models/Patient.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "../utils/notifications.js";

export const getInvoices = catchAsync(async (req, res) => {
  const { role, clerkId } = req.user;
  const { appointment: appointmentId } = req.query;

  let patientObjectId;
  if (role === "patient") {
    const patient = await Patient.findOne({ clerkId });
    if (!patient) throw new AppError("Patient profile not found", 404);
    patientObjectId = patient._id;
  }
  const invoices = await invoiceService.getInvoices({
    role,
    patientObjectId,
    appointmentId,
  });
  res.json(invoices);
});

export const payInvoice = catchAsync(async (req, res) => {
  const { paymentMethod } = req.body;
  const invoice = await invoiceService.markAsPaid(req.params.id, paymentMethod);
  const patient = await Patient.findById(invoice.patient);
  createNotification({
    recipientClerkId: patient.clerkId,
    type: "invoice",
    title: "Payment Received",
    message: `Your payment of $${invoice.total} has been recorded. Thank you.`,
    relatedId: invoice._id,
  }).catch(console.error);
  res.json(invoice);
});
