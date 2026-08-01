import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RedirectPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.publicMetadata as any)?.role;

  const destinations: Record<string, string> = {
    admin: "/admin",
    doctor: "/doctor",
    receptionist: "/receptionist",
    patient: "/patient",
  };

  redirect(destinations[role] || "/unauthorized");
}
