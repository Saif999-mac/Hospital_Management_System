import { Webhook } from "svix";
import express from "express";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Receptionist from "../models/Receptionist.js";
import { clerkClient } from "../config/clerkClient.js";

const router = express.Router();

router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const svixHeaders = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    let evt;
    try {
      evt = wh.verify(req.body, svixHeaders);
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return res.status(400).json({ message: "Webhook verification failed" });
    }
    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, public_metadata } =
        evt.data;

      const role = public_metadata?.role || "patient";

      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: { role },
      });

      if (role === "patient") {
        await Patient.create({
          clerkId: id,
          name: `${first_name} ${last_name}`,
          email: email_addresses[0]?.email_address,
        });
      } else if (role === "doctor") {
        await Doctor.create({
          clerkId: id,
          name:
            public_metadata.name ||
            `${first_name || ""} ${last_name || ""}`.trim() ||
            email_addresses[0]?.email_address,
          email: email_addresses[0]?.email_address,
          specialization: public_metadata.specialization || "General",
          consultationFee: public_metadata.consultationFee || 500,
          department: public_metadata.department || "General",
        });
      } else if (role === "receptionist") {
        await Receptionist.create({
          clerkId: id,
          name:
            public_metadata.name ||
            `${first_name || ""} ${last_name || ""}`.trim() ||
            email_addresses[0]?.email_address,
          email: email_addresses[0]?.email_address,
          assignedDepartment:
            public_metadata.assignedDepartment || "Front Desk",
          shift: public_metadata.shift || "morning",
        });
      }
    }
    res.status(200).json({ received: true });
  },
);
export default router;
