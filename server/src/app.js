import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import errorHandler from "./middleware/errorHandler.js";
import { authLimiter } from "./middleware/rateLimiters.js";

// Routes
import testRoutes from "./routes/testRoutes.js";
import webhookRoutes from "./routes/webhooks.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import InvoiceRoutes from "./routes/invoiceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));

app.use("/api/webhooks", authLimiter, webhookRoutes);

app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/", testRoutes);
app.use("/patients", patientRoutes);
app.use("/doctors", doctorRoutes);
app.use("/receptionists", receptionistRoutes);
app.use("/doctors/:id/availability", availabilityRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/medical-records", medicalRecordRoutes);
app.use("/prescriptions", prescriptionRoutes);
app.use("/invoices", InvoiceRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorHandler);
export default app;
