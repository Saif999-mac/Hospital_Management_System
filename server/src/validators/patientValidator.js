import { z } from "zod";

export const updatePatientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  dob: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  allergies: z.array(z.string()).optional(),
});
