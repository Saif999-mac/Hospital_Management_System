import rateLimit from "express-rate-limit";

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many booking attempts, please slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts, please try again later." },
});
