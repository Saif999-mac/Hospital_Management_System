import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const roleRoutes: Record<string, string> = {
  "/admin": "admin",
  "/doctor": "doctor",
  "/receptionist": "receptionist",
  "/patient": "patient",
};

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/doctor(.*)",
  "/receptionist(.*)",
  "/patient(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const role = (sessionClaims?.publicMetadata as any)?.role;
  const matchedPrefix = Object.keys(roleRoutes).find((p) =>
    req.nextUrl.pathname.startsWith(p),
  );

  if (matchedPrefix && role !== roleRoutes[matchedPrefix]) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/:path*",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
