import { verifyToken } from "@clerk/backend";
import { clerkClient } from "../config/clerkClient.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No Token Provided" });
    }
    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const user = await clerkClient.users.getUser(payload.sub);
    req.user = {
      clerkId: user.id,
      role: user.publicMetadata.role,
      email: user.emailAddresses[0]?.emailAddress,
    };
    next();
  } catch (error) {
    console.error("Auth verification failed:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
