# Hospital Management System — 30-Day Build Guide

**Stack:** Next.js 14 (App Router) · Express.js · MongoDB (Mongoose) · Clerk (Auth + RBAC) · TailwindCSS · shadcn/ui · Recharts · Deployed on Vercel (frontend) + Render/Railway (backend) + MongoDB Atlas

**Roles:** Admin, Doctor, Receptionist, Patient

> This guide assumes you're comfortable with basic Next.js/Express/Mongoose syntax (you already are, from your MERN work). It focuses on **architecture decisions, schema design, RBAC patterns, and the code that's actually hard to get right** — not boilerplate `npm install` hand-holding. Repetitive CRUD days give you the pattern once, then a checklist to repeat it for the next resource.

---

## 0. Before You Start: Architecture Overview

### 0.1 Why this stack shape

- **Next.js App Router (frontend)**: route groups per role (`/admin`, `/doctor`, `/receptionist`, `/patient`) so layout-level access control is trivial.
- **Express (backend)**: kept separate from Next.js API routes deliberately — a real HMS backend should be deployable independently, testable independently, and swappable (e.g., if you later add a mobile app, it hits the same Express API).
- **Clerk**: handles sign-up/sign-in/session/JWT. You will NOT store passwords yourself. Clerk gives each user a `publicMetadata.role` field — this is your RBAC source of truth.
- **MongoDB**: document model fits HMS well — a `Prescription` naturally nests `medicines[]`, an `Appointment` naturally nests status history, etc.

### 0.2 Monorepo layout

```
hospital-management-system/
├── client/                 # Next.js app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/     # siblings, NOT nested in each other
│   │   │   └── sign-up/[[...sign-up]]/
│   │   ├── dashboard/               # real folder — placeholder landing page, Day 2
│   │   ├── (dashboard)/             # route group — organizes role folders, no URL segment added
│   │   │   ├── admin/
│   │   │   ├── doctor/
│   │   │   ├── receptionist/
│   │   │   └── patient/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   └── middleware.ts       # Clerk route protection
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # db.js, cloudinary.js, env.js
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/     # auth.js (Clerk verify), rbac.js, errorHandler.js
│   │   ├── services/       # business logic separated from controllers
│   │   ├── utils/
│   │   └── app.js
│   └── server.js
└── docs/                   # ADRs, ER diagram, API spec
```

**Why separate `controllers/` and `services/`?** This is the single biggest "clean architecture" lever for a project this size. Controllers only: parse request → call service → shape response. Services hold business logic (e.g., "can this doctor be booked at this time?") and are unit-testable without spinning up Express at all.

### 0.3 Core data model (ER sketch — build this on paper Day 1)

```
User(Clerk) 1───1 Profile(role-specific: Doctor | Patient | Receptionist | Admin)
Doctor 1───* Appointment *───1 Patient
Appointment 1───1 MedicalRecord (optional, created after visit)
MedicalRecord 1───* Prescription
Appointment 1───1 Invoice (Billing)
Doctor *───* Availability(slots)
User 1───* Notification
```

### 0.4 The 30-day map

| Week | Focus |
|---|---|
| 1 (Days 1–7) | Project scaffolding, DB design, Auth + RBAC end-to-end |
| 2 (Days 8–14) | Doctor & Patient management, Availability, Appointment booking |
| 3 (Days 15–21) | Medical records, Prescriptions, Billing |
| 4 (Days 22–27) | Dashboard/analytics, Notifications, Theme, Responsiveness, polish |
| 5 (Days 28–30) | Testing, security hardening, deployment |

---

## Week 1 — Foundations, Auth & RBAC

### Day 1 — Repo, Environments, DB Connection

**Goals**
- Initialize monorepo (`client/`, `server/`), git, `.env` strategy (`.env.local` for client, `.env` for server, never committed).
- Set up MongoDB Atlas cluster (free tier M0), get connection string, IP allowlist.
- Set up Express skeleton with a clean `app.js`/`server.js` split (app config vs. server bootstrap — makes testing with supertest possible later).

**Key code — `server/src/config/db.js`**
```js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== "production", // don't rebuild indexes in prod on every boot
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
```

**`server/src/app.js`** (app config, no `.listen()` here — testability)
```js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10kb" })); // cap body size — basic DoS hygiene
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// routes mounted here in later days

app.use(errorHandler); // ALWAYS last
export default app;
```

**`server/server.js`**
```js
import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

**Checkpoint:** `GET /health` returns `{status:"ok"}`, MongoDB connects without error.

**Set up Postman now — you'll use it every single day from here on.** Testing routes as you build them (not waiting until Day 28) is how you catch a broken controller the same day you wrote it, not three weeks later.

1. Install Postman (postman.com) if you haven't, or use the web version.
2. Create a new **Collection** named `HMS API`.
3. Create a **Collection Variable** called `baseUrl` set to `http://localhost:5000/api` — every request URL from now on is `{{baseUrl}}/whatever`, so switching to your deployed Render URL on Day 30 means changing one variable, not editing 40 saved requests.
4. Add your first request: `GET {{baseUrl}}/../health` (i.e., `http://localhost:5000/health`) → **Send** → confirm you get back `{"status":"ok"}` inside Postman, not just in the browser.
5. **Auth header, set up once, reused everywhere:** once Day 4–6 wires up Clerk, you'll grab a real session token from your browser's dev tools (Application → Cookies, or by logging what `getToken()` returns in a client component temporarily) and add it as a Collection-level **Authorization → Bearer Token** — so every request in the collection automatically carries it, instead of pasting the token into each request by hand.

**Checkpoint:** Postman collection exists, `baseUrl` variable is set, and the `/health` request returns 200 inside Postman.

---

### Day 2 — Next.js Scaffold + Clerk Install

**Goals**
- `npx create-next-app@latest client` (App Router, TypeScript, Tailwind — all yes).
- Install Clerk (`@clerk/nextjs`) and `next-themes`.
- Wrap root layout in `<ClerkProvider>` + `<ThemeProvider>`.
- Build sign-in/sign-up pages using Clerk's prebuilt `<SignIn/>`/`<SignUp/>` components.
- Build one placeholder dashboard page to confirm the whole chain works.

**Exact folder structure to create — build this before writing any files, it avoids two common mistakes (sign-up nested inside sign-in, and a route-group `page.tsx` colliding with the root page):**

```
client/app/
├── (auth)/
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   └── sign-up/                    ← SIBLING of sign-in, not nested inside it
│       └── [[...sign-up]]/
│           └── page.tsx
├── dashboard/                      ← a REAL folder (no parentheses) — this is your placeholder route
│   └── page.tsx
├── layout.tsx
└── page.tsx                        ← your actual home/landing page, already created by create-next-app
```

**Create it with:**
```bash
cd client/app
mkdir -p "(auth)/sign-in/[[...sign-in]]"
mkdir -p "(auth)/sign-up/[[...sign-up]]"
mkdir -p dashboard
```

`(auth)` is a route group (parentheses = ignored in the URL), so `sign-in` resolves to `/sign-in` and `sign-up` resolves to `/sign-up` — they must be siblings for that to work. `dashboard/` is deliberately a normal folder here, not the `(dashboard)` route group you'll build in Week 2 for role folders — keep those two concepts separate: `(dashboard)` groups `admin/doctor/patient/receptionist` later without adding a URL segment; `dashboard/` (no parens) is just today's placeholder landing spot after login.

**`client/components/theme-provider.tsx`** (create this file — `layout.tsx` below imports it, so it must exist first)
```bash
mkdir -p client/components
```
```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**`client/app/layout.tsx`**
```tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**`client/app/(auth)/sign-in/[[...sign-in]]/page.tsx`**
```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

**`client/app/(auth)/sign-up/[[...sign-up]]/page.tsx`**
```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

**`client/app/dashboard/page.tsx`**
```tsx
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user?.firstName}</h1>
      <p className="text-muted-foreground">Placeholder dashboard — role-based routing arrives Day 6.</p>
    </div>
  );
}
```

**`client/.env.local`** (get keys from dashboard.clerk.com → your app → API Keys)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```
> Note: older Clerk tutorials use `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `..._AFTER_SIGN_UP_URL`. Those are deprecated in current Clerk versions and are silently ignored — use `..._FORCE_REDIRECT_URL` as shown above, or the redirect just won't fire and you'll land on `/` instead. On Day 6, when role-based redirect logic replaces this static `/dashboard` target, you'll point these at `/redirect` instead.

**Checkpoint:** `npm run dev`, then in the browser:
- `http://localhost:3000/sign-up` renders Clerk's sign-up form (not a 404).
- `http://localhost:3000/sign-in` renders separately at its own URL.
- Signing up redirects you to `http://localhost:3000/dashboard` and shows "Welcome, [your first name]."
- Clerk dashboard → Users tab → your test account appears.

**Bonus — replace the default `create-next-app` boilerplate with a real public home page.** Right now `app/page.tsx` still has Next.js's default "Get started by editing app/page.tsx" content. Replace it with a proper landing page — this is the page a visitor sees before logging in, so it needs a hero, a value prop, and clear sign-in/sign-up entry points.

**`client/app/page.tsx`**
```tsx
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/redirect"); // already logged in — skip the marketing page, role-router sends them to the right dashboard

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between px-8 py-6">
        <span className="text-xl font-bold">MediCare HMS</span>
        <div className="flex gap-3">
          <Link href="/sign-in" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
            Sign In
          </Link>
          <Link href="/sign-up" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Hospital management, built around every role that keeps care running
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Book appointments, manage records, and coordinate care — one platform for
          admins, doctors, receptionists, and patients.
        </p>
        <div className="flex gap-4">
          <Link href="/sign-up" className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">
            Create an account
          </Link>
          <Link href="/sign-in" className="rounded-md border px-6 py-3 font-medium hover:bg-accent">
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 px-8 py-16 md:grid-cols-4">
        {[
          { title: "Book Appointments", desc: "Real-time availability, no double-booking." },
          { title: "Medical Records", desc: "Secure, role-scoped patient history." },
          { title: "Prescriptions & Billing", desc: "From diagnosis to invoice, tracked end to end." },
          { title: "Live Dashboards", desc: "Role-specific insight, not one generic view." },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
```

**Checkpoint (bonus):** `http://localhost:3000/` shows the real landing page when logged out, and auto-redirects to `/dashboard` if you're already signed in — confirming the `auth()` server check works, which is the same pattern you'll reuse for every protected page from here on.

---

### Day 3 — Mongoose Schemas: User Profiles

**Design decision:** Clerk owns identity (email, password, session). MongoDB owns *domain* data. Link them with `clerkId` as the foreign key — never duplicate auth data into Mongo.

**`server/src/models/Doctor.js`**
```js
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    specialization: { type: String, required: true },
    qualifications: [String],
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, required: true },
    department: { type: String, required: true },
    avatarUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
```

**`server/src/models/Patient.js`**
```js
import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    dob: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    bloodGroup: String,
    address: String,
    emergencyContact: { name: String, phone: String },
    allergies: [String],
    avatarUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
```

**`server/src/models/Receptionist.js`**
```js
import mongoose from "mongoose";

const receptionistSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    assignedDepartment: { type: String, default: "General" },
    shift: { type: String, enum: ["morning", "evening", "night"], default: "morning" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Receptionist", receptionistSchema);
```

**`server/src/models/Admin.js`**
```js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    permissions: {
      type: [String],
      default: ["manage_users", "manage_billing", "view_analytics"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
```

**Seed script — inserts one test doc of each model, so you can verify all 4 compile and save correctly without waiting for the real auth/Clerk flow to create them.**

`server/src/seed.js`
```js
import "dotenv/config";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import Patient from "./models/Patient.js";
import Doctor from "./models/Doctor.js";
import Receptionist from "./models/Receptionist.js";
import Admin from "./models/Admin.js";

const seed = async () => {
  await connectDB();

  // Wipe existing test data first so re-running this script doesn't throw duplicate-key errors
  await Promise.all([
    Patient.deleteMany({ clerkId: /^seed_/ }),
    Doctor.deleteMany({ clerkId: /^seed_/ }),
    Receptionist.deleteMany({ clerkId: /^seed_/ }),
    Admin.deleteMany({ clerkId: /^seed_/ }),
  ]);

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

  console.log("Seeded:", { patient: patient._id, doctor: doctor._id, receptionist: receptionist._id, admin: admin._id });
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

**Add a script shortcut** — in `server/package.json`:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node src/seed.js"
}
```

**Run it:**
```bash
cd server
npm run seed
```

Expected terminal output:
```
MongoDB connected: <your-cluster-host>
Seeded: { patient: 65f..., doctor: 65f..., receptionist: 65f..., admin: 65f... }
```

**Checkpoint:** run `npm run seed` — it exits with no errors and prints all 4 generated `_id`s. Then verify visually in **MongoDB Compass**: connect using your `MONGO_URI`, and confirm 4 separate collections exist — `patients`, `doctors`, `receptionists`, `admins` — each with exactly one document matching the fields above. If any model has a typo or missing required field, `npm run seed` will throw a clear Mongoose validation error naming the exact field, right in the terminal — that's the point of doing this before wiring up the real Clerk signup flow on Day 5.

---

### Day 4 — RBAC Design (the part everyone gets wrong)

**Two layers of RBAC — you need both:**

1. **Clerk `publicMetadata.role`** — set on the user object itself. This is what your Next.js `middleware.ts` checks *before rendering a page* (fast, no DB call).
2. **Express middleware** — verifies the Clerk JWT AND re-checks the role against your DB on every protected API call. **Never trust the frontend role check alone** — someone can edit `publicMetadata` client-side calls if you don't verify server-side.

**Critical setup step, easy to miss and the single most common cause of a mysterious 401/unauthorized loop: `publicMetadata` is NOT included in the session token by default.** Setting `role` on a user's `publicMetadata` in the Clerk dashboard does nothing for `middleware.ts` until you explicitly tell Clerk to embed it in every session token it issues.

1. dashboard.clerk.com → your app → **Sessions** (left sidebar).
2. **Customize session token** → **Edit**.
3. Paste:
```json
{ "publicMetadata": "{{user.public_metadata}}" }
```
4. **Save.**

This only affects tokens minted **after** saving — anyone already signed in is still carrying an old token without this claim. **Sign out completely and sign back in** any time you change this setting, or `sessionClaims?.publicMetadata` will keep silently returning `undefined` and every role check will fail even though the dashboard "looks" correctly configured.

**Also build the page `middleware.ts` redirects to on a failed check — it doesn't exist by default, and skipping this turns a clean 403-style redirect into a confusing 404.**

`client/app/unauthorized/page.tsx`
```tsx
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You don't have permission to view this page.</p>
      <Link href="/redirect" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        Go to my dashboard
      </Link>
    </div>
  );
}
```

**`client/middleware.ts`**
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const roleRoutes: Record<string, string> = {
  "/admin": "admin",
  "/doctor": "doctor",
  "/receptionist": "receptionist",
  "/patient": "patient",
};

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/doctor(.*)", "/receptionist(.*)", "/patient(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const role = (sessionClaims?.publicMetadata as any)?.role;
  const matchedPrefix = Object.keys(roleRoutes).find((p) => req.nextUrl.pathname.startsWith(p));

  if (matchedPrefix && role !== roleRoutes[matchedPrefix]) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

**`server/src/config/clerkClient.js`** — one shared, correctly-configured Clerk client, imported everywhere else instead of pulling `clerkClient` directly from `@clerk/backend`. Current `@clerk/backend` versions don't export a ready-made `clerkClient` singleton — you build one yourself with `createClerkClient()`, once, and reuse it.
```js
import { createClerkClient } from "@clerk/backend";

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
```

**`server/src/middleware/auth.js`** — verify Clerk session on the Express side
```js
import { verifyToken } from "@clerk/backend";
import { clerkClient } from "../config/clerkClient.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });

    const user = await clerkClient.users.getUser(payload.sub);
    req.user = {
      clerkId: user.id,
      role: user.publicMetadata.role,
      email: user.emailAddresses[0]?.emailAddress,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
```

**`server/src/middleware/rbac.js`**
```js
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  next();
};
```

**Usage pattern you'll repeat everywhere:**
```js
router.post("/", requireAuth, requireRole("admin", "receptionist"), createPatient);
```

**Checkpoint:** hit a protected route with no token → 401. Hit it with a "patient" role token on an admin-only route → 403.

**Verify in Postman, not just by reading the code:** create a temporary test route (`GET /api/test-protected`, `requireAuth, requireRole("admin")`) mounted just for this check. Send it with no `Authorization` header → expect `401`. Add a valid patient-role Bearer token → expect `403`. Add a valid admin-role token → expect `200`. Save all three as separate Postman requests inside a new **RBAC** folder in your collection — you'll reuse this exact 3-request pattern (no token / wrong role / right role) for every protected route you build for the rest of the project, so it's worth having it saved once now.

---

### Day 5 — Post-Signup Role Assignment via Clerk Webhooks

**Problem:** when someone signs up, they have no role yet. You need a flow where:
- Patients self-register and get `role: "patient"` automatically.
- Doctors/Receptionists are *invited* by an Admin (never self-serve — you don't want randoms registering as a doctor).

**Clerk webhook** (`user.created` event) → Express endpoint → set default role + create matching Mongo profile.

**`server/src/routes/webhooks.js`**
```js
import { Webhook } from "svix";
import express from "express";
import Patient from "../models/Patient.js";
import { clerkClient } from "../config/clerkClient.js";

const router = express.Router();

// IMPORTANT: this route needs raw body, not JSON-parsed — mount before express.json()
router.post("/clerk", express.raw({ type: "application/json" }), async (req, res) => {
  const svixHeaders = {
    "svix-id": req.headers["svix-id"],
    "svix-timestamp": req.headers["svix-timestamp"],
    "svix-signature": req.headers["svix-signature"],
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  let evt;
  try {
    evt = wh.verify(req.body, svixHeaders);
  } catch (err) {
    return res.status(400).json({ message: "Webhook verification failed" });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

    // Default role: patient, UNLESS invited with a pre-set role (see admin invite flow, Day 9)
    const role = public_metadata?.role || "patient";

    await clerkClient.users.updateUserMetadata(id, { publicMetadata: { role } });

    if (role === "patient") {
      await Patient.create({
        clerkId: id,
        name: `${first_name} ${last_name}`,
        email: email_addresses[0]?.email_address,
      });
    }
    // doctor/receptionist profiles are created explicitly during the invite-accept flow, Day 9
  }

  res.status(200).json({ received: true });
});

export default router;
```

**Checkpoint:** sign up as a new user → check Clerk dashboard → `publicMetadata.role === "patient"` → check MongoDB → a `Patient` doc exists with matching `clerkId`.

---

### Day 6 — Frontend Auth Wiring + Role-Based Redirects

**Goals**
- After login, redirect to the correct dashboard root based on role (Clerk's `afterSignInUrl` won't know the role dynamically — use a `/redirect` intermediary page).
- Build `lib/api.ts` — a typed fetch wrapper that auto-attaches the Clerk session token to every request to Express.

**`client/app/redirect/page.tsx`**
```tsx
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
```

**`client/lib/api.ts`**
```ts
import { useAuth } from "@clerk/nextjs";

export function useApi() {
  const { getToken } = useAuth();

  async function request(path: string, options: RequestInit = {}) {
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error((await res.json()).message || "Request failed");
    return res.json();
  }

  return { request };
}
```

**Checkpoint:** a logged-in patient hitting `/redirect` lands on `/patient`. A raw fetch to your Express API from a client component includes a valid `Authorization` header.

**Now build the dashboard shell — the piece the guide was missing.** Every page you build from Week 2 onward (patient list, appointment table, dashboards, etc.) needs to render *inside* a persistent sidebar + top bar, not as a bare page. Do this now, once, correctly, so you never have to retrofit navigation onto 15 already-built pages later.

**Why this uses `layout.tsx`, not a component you import into every page:** Next.js App Router layouts persist across navigation — when you click from `/admin/patients` to `/admin/doctors`, the sidebar and top bar do **not** re-render or flash; only the inner page content swaps. If you instead wrapped every page manually with `<Sidebar>{content}</Sidebar>`, you'd get a full remount on every click. A `layout.tsx` file placed inside a folder automatically wraps every page and every nested route under that folder — that's the whole mechanism.

**Step 1 — install the icon set used in the sidebar**
```bash
cd client
npm install lucide-react
```

**Step 2 — one shared, config-driven sidebar component (used by all 4 roles, styled differently only by which links it's given)**

`client/components/dashboard-shell.tsx`
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn's classnames helper, added by `shadcn init`

export type NavItem = { label: string; href: string; icon: LucideIcon };

export function DashboardShell({
  navItems,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — hidden on mobile, shown from md breakpoint up. Day 27 adds the mobile drawer version. */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="border-b px-6 py-5">
          <span className="text-lg font-bold">MediCare HMS</span>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <span className="font-medium md:hidden">MediCare HMS</span>
          <div className="ml-auto flex items-center gap-4">
            {/* Notification bell wired up on Day 26 — placeholder slot for now */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
```

**What `cn()` does:** merges Tailwind classes conditionally without duplicate/conflicting utility classes fighting each other (e.g., two different `bg-*` classes). It comes bundled from `npx shadcn@latest init` at `client/lib/utils.ts` — if you skipped that step, add it manually:
```ts
// client/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
(`npm install clsx tailwind-merge` if not already present from `shadcn init`.)

**Step 3 — one thin `layout.tsx` per role, each just supplying its own nav config to the shared shell**

**Important — these must be Client Components (`"use client"`), not Server Components.** `navItems` contains `lucide-react` icon references, which are functions. Functions can't be passed from a Server Component into a Client Component (`DashboardShell` has `"use client"`) — React can't serialize a function across that boundary, and you'll get `Error: Functions cannot be passed directly to Client Components`. Since these layout files don't need any server-only APIs (no `auth()`, no `await`, no DB calls), marking them `"use client"` is safe and removes the boundary entirely.

`client/app/(dashboard)/admin/layout.tsx`
```tsx
"use client";

import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import { LayoutDashboard, Users, Stethoscope, CalendarDays, Receipt, BarChart3 } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { label: "Billing", href: "/admin/billing", icon: Receipt },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={navItems} roleLabel="Admin">{children}</DashboardShell>;
}
```

`client/app/(dashboard)/doctor/layout.tsx`
```tsx
"use client";

import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import { LayoutDashboard, CalendarDays, Users, FileText, Pill } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
  { label: "My Appointments", href: "/doctor/appointments", icon: CalendarDays },
  { label: "My Patients", href: "/doctor/patients", icon: Users },
  { label: "Medical Records", href: "/doctor/records", icon: FileText },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={navItems} roleLabel="Doctor">{children}</DashboardShell>;
}
```

`client/app/(dashboard)/receptionist/layout.tsx`
```tsx
"use client";

import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import { LayoutDashboard, CalendarDays, Users, Receipt } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/receptionist", icon: LayoutDashboard },
  { label: "Appointments", href: "/receptionist/appointments", icon: CalendarDays },
  { label: "Patients", href: "/receptionist/patients", icon: Users },
  { label: "Billing", href: "/receptionist/billing", icon: Receipt },
];

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={navItems} roleLabel="Receptionist">{children}</DashboardShell>;
}
```

`client/app/(dashboard)/patient/layout.tsx`
```tsx
"use client";

import { DashboardShell, NavItem } from "@/components/dashboard-shell";
import { LayoutDashboard, CalendarDays, FileText, Pill, Receipt, User } from "lucide-react";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/patient", icon: LayoutDashboard },
  { label: "My Appointments", href: "/patient/appointments", icon: CalendarDays },
  { label: "Medical Records", href: "/patient/records", icon: FileText },
  { label: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
  { label: "Billing", href: "/patient/billing", icon: Receipt },
  { label: "Profile", href: "/patient/profile", icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={navItems} roleLabel="Patient">{children}</DashboardShell>;
}
```

**How this connects to what you already built:** the `page.tsx` files land inside these same folders — e.g., `app/(dashboard)/admin/page.tsx` (your Day 23 admin dashboard code) automatically gets wrapped by `admin/layout.tsx`'s sidebar with zero extra work on your part. When you build `app/(dashboard)/admin/patients/page.tsx` on Day 8, it inherits the exact same sidebar too, and the "Patients" link auto-highlights as active because of the `usePathname()` check — you never have to manually mark a nav item active on any future page.

**One nested-folder correction to make now, matching what tripped you up earlier:** these 4 layouts live inside `(dashboard)/admin/`, `(dashboard)/doctor/`, etc. — real folders *nested inside* the `(dashboard)` route group. That's different from the standalone `dashboard/` folder you made for the Day 2 placeholder page. Confirm your structure looks like this before moving on:
```bash
cd client/app && find . -maxdepth 3 -iname "*dashboard*" -o -iname "layout.tsx"
```
Expected: `./dashboard/page.tsx` (Day 2 placeholder — you'll delete this once `/redirect` + role dashboards are live), plus `./(dashboard)/admin/layout.tsx`, `./(dashboard)/doctor/layout.tsx`, `./(dashboard)/receptionist/layout.tsx`, `./(dashboard)/patient/layout.tsx`.

**Checkpoint:** sign in as any role → land on that role's dashboard → sidebar shows only that role's nav links, with the current page highlighted → clicking between (currently empty/placeholder) nav links doesn't cause the sidebar or top bar to flicker or remount → the Clerk `<UserButton/>` in the top right lets you sign out from any page.

---

### Day 7 — Week 1 Review + Global Error Handling + Logging

**Goals**
- `server/src/middleware/errorHandler.js` — one place all errors funnel to, consistent JSON shape `{message, code, details?}`.
- Async wrapper (`catchAsync`) so you never write repetitive try/catch in controllers.
- Review: draw the ER diagram again from memory, compare to Day 1 sketch — refine.

**`server/src/utils/catchAsync.js`**
```js
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**`server/src/middleware/errorHandler.js`**
```js
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ message });
};
```

**Checkpoint (end of Week 1):** Auth + RBAC works end-to-end for all 4 roles, both frontend route protection and backend token verification are live, and error handling is centralized. This is the hardest week — everything after this is mostly repeating patterns.

---

## Week 2 — Doctor & Patient Management, Availability, Appointments

### Day 8 — Patient Management CRUD

**Pattern to repeat for every resource (learn it once, here):**
1. Model (done Day 3)
2. Service (`patientService.js`) — pure business logic, no `req`/`res`
3. Controller — thin, calls service
4. Routes — wires up `requireAuth` + `requireRole`
5. Zod/Joi validation schema
6. Frontend: list page (table), detail page, create/edit form (React Hook Form)

**`server/src/services/patientService.js`**
```js
import Patient from "../models/Patient.js";
import { AppError } from "../utils/AppError.js";

export const getPatients = async ({ page = 1, limit = 10, search = "" }) => {
  const query = search
    ? { name: { $regex: search, $options: "i" } }
    : {};
  const patients = await Patient.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  const total = await Patient.countDocuments(query);
  return { patients, total, page: Number(page), pages: Math.ceil(total / limit) };
};

export const getPatientById = async (id) => {
  const patient = await Patient.findById(id);
  if (!patient) throw new AppError("Patient not found", 404);
  return patient;
};

export const updatePatient = async (id, data) => {
  const patient = await Patient.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!patient) throw new AppError("Patient not found", 404);
  return patient;
};
```

**`server/src/utils/AppError.js`**
```js
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

**Access rule:** Admin/Receptionist see all patients. A Patient can only ever fetch/update *their own* record — enforce with `req.user.clerkId === patient.clerkId` inside the controller, not just role checking.

**Checkpoint:** paginated patient list renders in a table on `/admin/patients` and `/receptionist/patients`; a patient can view/edit only their own profile at `/patient/profile`.

**Verify the API directly in Postman before trusting the frontend UI.** Add a **Patients** folder to your collection with:
- `GET {{baseUrl}}/patients?page=1&limit=10` (admin token) → expect `200` with a paginated `{patients, total, page, pages}` shape.
- `GET {{baseUrl}}/patients/:id` with someone else's patient `_id`, sent using a **patient-role** token → expect `403`, confirming ownership-checking actually works and isn't just a UI-level hide.
- `PATCH {{baseUrl}}/patients/:id` with an invalid field (e.g., `gender: "banana"`) → expect a `400` validation error naming the bad field, not a silent save or a `500`.

Doing this in Postman first, before touching the frontend table, tells you immediately whether a bug is in your API or in your React code — a distinction that gets much harder to isolate once you're only testing through the browser.

---

### Day 9 — Doctor Management + Admin Invite Flow

**Goals**
- Admin-only "Invite Doctor" form → calls Clerk's `invitations.create` API with `publicMetadata: { role: "doctor" }` pre-set → doctor gets an email, signs up, webhook (Day 5) sees `public_metadata.role` already set to `"doctor"` and skips the default-to-patient path — instead create the `Doctor` profile.
- Update the Day 5 webhook handler (same `import { clerkClient } from "../config/clerkClient.js";` from Day 5 — reused, not re-imported differently):

```js
if (evt.type === "user.created") {
  const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
  const role = public_metadata?.role || "patient";
  await clerkClient.users.updateUserMetadata(id, { publicMetadata: { role } });

  if (role === "patient") {
    await Patient.create({ clerkId: id, name: `${first_name} ${last_name}`, email: email_addresses[0]?.email_address });
  } else if (role === "doctor") {
    await Doctor.create({
      clerkId: id,
      name: `${first_name} ${last_name}`,
      email: email_addresses[0]?.email_address,
      specialization: public_metadata.specialization || "General",
      consultationFee: public_metadata.consultationFee || 500,
      department: public_metadata.department || "General",
    });
  } else if (role === "receptionist") {
    await Receptionist.create({ clerkId: id, name: `${first_name} ${last_name}`, email: email_addresses[0]?.email_address });
  }
}
```

**Admin invite endpoint:**
```js
import { clerkClient } from "../config/clerkClient.js";

export const inviteDoctor = catchAsync(async (req, res) => {
  const { email, specialization, consultationFee, department } = req.body;
  const invitation = await clerkClient.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: "doctor", specialization, consultationFee, department },
    redirectUrl: `${process.env.CLIENT_URL}/sign-up`,
  });
  res.status(201).json({ invitation });
});
```

**Checkpoint:** Admin invites a doctor by email → doctor receives invite → signs up → lands in DB as a `Doctor` with correct role, no manual role editing needed.

---

### Day 10 — Doctor Availability / Slot Management

**Design decision:** don't pre-generate every possible slot as a document (huge, wasteful). Instead store a **weekly recurring template** + **exceptions** (leave days), and compute actual bookable slots on the fly when a patient requests them for a given date.

**`server/src/models/Availability.js`**
```js
import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true },
  weeklySchedule: [
    {
      day: { type: String, enum: ["mon","tue","wed","thu","fri","sat","sun"] },
      startTime: String, // "09:00"
      endTime: String,   // "17:00"
      slotDurationMins: { type: Number, default: 20 },
    },
  ],
  leaveDates: [Date], // specific dates doctor is unavailable
});

export default mongoose.model("Availability", availabilitySchema);
```

**Slot computation service** — this is the interesting logic:
```js
export const getAvailableSlots = async (doctorId, dateStr) => {
  const date = new Date(dateStr);
  const dayName = ["sun","mon","tue","wed","thu","fri","sat"][date.getDay()];

  const availability = await Availability.findOne({ doctor: doctorId });
  if (!availability) return [];

  const isOnLeave = availability.leaveDates.some(
    (d) => d.toDateString() === date.toDateString()
  );
  if (isOnLeave) return [];

  const daySchedule = availability.weeklySchedule.find((s) => s.day === dayName);
  if (!daySchedule) return [];

  const slots = generateSlots(daySchedule.startTime, daySchedule.endTime, daySchedule.slotDurationMins);

  const booked = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    status: { $ne: "cancelled" },
  }).select("time");

  const bookedTimes = new Set(booked.map((a) => a.time));
  return slots.filter((s) => !bookedTimes.has(s));
};

function generateSlots(start, end, durationMins) {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  while (h < endH || (h === endH && m < endM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += durationMins;
    if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
  }
  return slots;
}
```

**Checkpoint:** given a doctor and a date, the API returns only genuinely open slots — already-booked and leave days are correctly excluded.

---

### Day 11 — Appointment Booking (Core Flow)

**`server/src/models/Appointment.js`**
```js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // "14:20"
    reason: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending",
    },
    bookedBy: { type: String, enum: ["patient", "receptionist"], required: true },
    cancellationReason: String,
  },
  { timestamps: true }
);

// Prevent double-booking at the DB level, not just app logic
appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } });

export default mongoose.model("Appointment", appointmentSchema);
```

**Why the compound unique index matters:** relying only on the "filter free slots" service (Day 10) to prevent double-booking has a race condition — two patients could both request the same free slot within milliseconds of each other. The DB-level partial unique index is your real guarantee; the service layer is just UX (fast feedback), not the source of truth.

**Booking service with race-condition handling:**
```js
export const bookAppointment = async ({ patientId, doctorId, date, time, reason, bookedBy }) => {
  try {
    return await Appointment.create({ patient: patientId, doctor: doctorId, date, time, reason, bookedBy });
  } catch (err) {
    if (err.code === 11000) throw new AppError("This slot was just booked by someone else. Please pick another.", 409);
    throw err;
  }
};
```

**Checkpoint:** two rapid requests for the same doctor/date/time — one succeeds, one gets a clean 409, not a server crash.

**This one is much easier to actually trigger in Postman than by clicking fast in two browser tabs.** Save a `POST {{baseUrl}}/appointments` request with a fixed `doctor`, `date`, and `time` body. Use Postman's **Runner** (or just fire the same saved request twice in quick succession from two open Postman tabs) — the first returns `201` with the created appointment, the second returns `409` with your "slot was just booked" message. If both return `201`, your unique index isn't actually active — go back and confirm it in MongoDB Compass under the `appointments` collection's Indexes tab before moving on.

---

### Day 12 — Appointment Management UI (all 4 roles see it differently)

**Access matrix (build this table into your route guards, don't wing it per-page):**

| Action | Admin | Doctor | Receptionist | Patient |
|---|---|---|---|---|
| View all appointments | ✅ | own only | ✅ | own only |
| Book appointment | ✅ | ❌ | ✅ (for any patient) | ✅ (for self) |
| Cancel appointment | ✅ | own (decline) | ✅ | own only |
| Mark completed | ✅ | ✅ | ❌ | ❌ |
| Reschedule | ✅ | ❌ | ✅ | ✅ (own, before confirm) |

**Controller enforcing the "own only" rule:**
```js
export const getAppointments = catchAsync(async (req, res) => {
  const { role, clerkId } = req.user;
  let filter = {};

  if (role === "doctor") {
    const doctor = await Doctor.findOne({ clerkId });
    filter.doctor = doctor._id;
  } else if (role === "patient") {
    const patient = await Patient.findOne({ clerkId });
    filter.patient = patient._id;
  }
  // admin/receptionist see everything — no filter

  const appointments = await Appointment.find(filter)
    .populate("doctor", "name specialization")
    .populate("patient", "name phone")
    .sort({ date: 1, time: 1 });

  res.json(appointments);
});
```

**Frontend:** build one shared `<AppointmentTable>` component that accepts a `role` prop and conditionally renders action buttons (cancel/complete/reschedule) — don't build 4 separate tables.

**Checkpoint:** each role's appointment list is correctly scoped without any client-side filtering hacks (the API already returns only what they should see).

---

### Day 13 — Appointment Status Lifecycle + Reschedule Logic

**Goals**
- State machine: `pending → confirmed → completed`, or `→ cancelled`/`no-show` at any point before `completed`.
- Enforce valid transitions server-side (don't let the frontend set arbitrary status).

```js
const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no-show"],
  completed: [],
  cancelled: [],
  "no-show": [],
};

export const updateAppointmentStatus = async (id, newStatus, actorRole) => {
  const appt = await Appointment.findById(id);
  if (!appt) throw new AppError("Appointment not found", 404);

  if (!VALID_TRANSITIONS[appt.status].includes(newStatus)) {
    throw new AppError(`Cannot move appointment from ${appt.status} to ${newStatus}`, 400);
  }
  if (newStatus === "completed" && actorRole !== "doctor" && actorRole !== "admin") {
    throw new AppError("Only a doctor can mark an appointment completed", 403);
  }

  appt.status = newStatus;
  await appt.save();

  // Trigger notification (built Day 25) — fire and forget, don't block response
  createNotification({ /* ... */ }).catch(console.error);

  return appt;
};
```

**Checkpoint:** attempting an invalid transition (e.g., `completed → confirmed`) is rejected with a clear 400.

---

### Day 14 — Week 2 Review + Doctor's Own Dashboard (Today's Schedule)

Build the doctor's "today" view: today's confirmed appointments sorted by time, with quick actions (start consultation → opens medical record form, Day 18). This is your first real dashboard widget — reuse the pattern for Day 23's full analytics dashboard.

```js
export const getTodaySchedule = catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ clerkId: req.user.clerkId });
  const today = new Date();
  const appointments = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: startOfDay(today), $lte: endOfDay(today) },
    status: { $in: ["confirmed", "pending"] },
  }).populate("patient", "name phone dob gender").sort({ time: 1 });
  res.json(appointments);
});
```

**Checkpoint (end of Week 2):** full booking flow works: patient/receptionist picks a doctor → sees real open slots → books → doctor sees it on their "today" dashboard → status transitions are enforced.

---

## Week 3 — Medical Records, Prescriptions, Billing

### Day 15 — Medical Record Schema + Cloudinary File Attachments

You've already debugged Cloudinary + multer for avatars — reuse that exact upload pipeline here for lab reports/scans attached to a medical record.

**`server/src/models/MedicalRecord.js`**
```js
import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    visitDate: { type: Date, default: Date.now },
    symptoms: [String],
    diagnosis: { type: String, required: true },
    notes: String,
    vitals: {
      bloodPressure: String,
      temperature: Number,
      pulse: Number,
      weight: Number,
      height: Number,
    },
    attachments: [{ url: String, publicId: String, label: String }],
  },
  { timestamps: true }
);

export default mongoose.model("MedicalRecord", medicalRecordSchema);
```

**Upload middleware (multer memory storage → Cloudinary stream, avoids writing to local disk — this sidesteps the exact "nonexistent local path" class of bug you were debugging):**
```js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

export const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
```

**Checkpoint:** a doctor can attach a lab report PDF/image to a medical record with no temp files touching disk.

---

### Day 16 — Medical Record Access Control (the sensitive-data day)

Medical records are the most privacy-sensitive resource in the whole system. Access rules:
- **Patient**: read-only, own records only.
- **Doctor**: full CRUD, but only on records for patients they've had an appointment with (not the whole hospital's patient base).
- **Receptionist**: **no access** to clinical content — receptionists handle scheduling/billing, not diagnoses. This is a deliberate real-world HIPAA-style boundary worth calling out.
- **Admin**: read access for oversight, no edit (preserves clinical integrity/audit trail).

```js
export const canDoctorAccessPatient = async (doctorId, patientId) => {
  const hasHistory = await Appointment.exists({ doctor: doctorId, patient: patientId });
  if (!hasHistory) throw new AppError("No treatment relationship with this patient", 403);
};
```

Call this guard inside `createMedicalRecord` and `getMedicalRecordsByPatient` before touching data.

**Checkpoint:** a doctor with zero appointment history with a given patient gets a 403 when trying to view/create that patient's records — even though they're authenticated as a valid doctor.

---

### Day 17 — Medical Record Timeline UI (Patient History View)

Build a chronological timeline component (`/patient/records` and `/doctor/patients/:id/records`) — vertical timeline, each entry expandable to show vitals, diagnosis, attachments. Use `date-fns` for relative time formatting. This is a good day to practice composing shadcn/ui `Accordion` + `Badge` components for status coloring (diagnosis severity, visit type).

**Checkpoint:** opening a patient's record from the doctor side shows full chronological history in under 2 clicks from the appointment list.

---

### Day 18 — Prescriptions

**`server/src/models/Prescription.js`**
```js
import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalRecord", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: String,       // "500mg"
        frequency: String,    // "twice daily"
        duration: String,     // "5 days"
        instructions: String, // "after food"
      },
    ],
    issuedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);
```

**Design note:** prescription is intentionally its own collection (not embedded in `MedicalRecord`) because you'll want to query "all active prescriptions for a patient" independently of any specific visit, e.g., for a pharmacy-facing view or drug-interaction checks later.

**Nice-to-have if time allows:** a printable prescription PDF using `@react-pdf/renderer` or server-side `pdfkit` — patients can download it.

**Checkpoint:** doctor creates a prescription tied to today's medical record; patient sees it immediately under their records.

---

### Day 19 — Billing: Invoice Model + Auto-generation

**`server/src/models/Invoice.js`**
```js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    items: [
      { description: String, amount: Number, quantity: { type: Number, default: 1 } },
    ],
    subtotal: Number,
    tax: { type: Number, default: 0 },
    total: Number,
    status: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cash", "card", "online", "insurance"] },
    paidAt: Date,
  },
  { timestamps: true }
);

invoiceSchema.pre("save", function (next) {
  this.subtotal = this.items.reduce((sum, i) => sum + i.amount * i.quantity, 0);
  this.total = this.subtotal + this.tax;
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
```

**Auto-generate invoice when an appointment is marked `completed`** (hook this into the Day 13 status service):
```js
export const generateInvoiceForAppointment = async (appointment) => {
  const doctor = await Doctor.findById(appointment.doctor);
  return Invoice.create({
    patient: appointment.patient,
    appointment: appointment._id,
    items: [{ description: `Consultation — ${doctor.specialization}`, amount: doctor.consultationFee }],
    tax: Math.round(doctor.consultationFee * 0.05), // example 5% tax
  });
};
```

**Checkpoint:** completing an appointment auto-creates an unpaid invoice with the correct consultation fee.

**Verify in Postman:** `PATCH {{baseUrl}}/appointments/:id/status` with `{ "status": "completed" }` (doctor or admin token) → then immediately `GET {{baseUrl}}/invoices?appointment=:id` → confirm a new invoice exists with `status: "unpaid"` and `total` matching that doctor's `consultationFee` plus tax. This chained two-request check (mutate, then re-fetch) is the pattern you'll reuse for every "action X should trigger side-effect Y" checkpoint from here through Day 26's notifications.

---

### Day 20 — Billing UI + Payment Status Updates

- Receptionist/Admin view: unpaid invoices list, "mark as paid" action, payment method selection.
- Patient view: their invoices, paid/unpaid badge, downloadable receipt.
- (Optional stretch): integrate Stripe test mode for a real "pay online" button — patient role only, webhook flips `status: "paid"`.

**Checkpoint:** a receptionist can mark an invoice paid; the patient's billing view reflects it instantly (either via refetch-on-focus or a simple polling/SWR revalidation).

---

### Day 21 — Week 3 Review + Data Integrity Audit

Go back through Days 15–20 and add:
- Mongoose schema `pre("remove")`/cascade logic — e.g., what happens to prescriptions if a medical record is deleted? (Recommendation: soft-delete medical records, never hard-delete — clinical data should be auditable, not erasable.)
- Add `deletedAt: Date` soft-delete field to `MedicalRecord` and `Invoice`; filter it out in all `find` queries via a Mongoose query middleware (`schema.pre(/^find/, function() { this.where({ deletedAt: null }) })`).

**Checkpoint (end of Week 3):** the full clinical + billing loop works: book → complete visit → medical record → prescription → invoice, all correctly access-controlled.

---

## Week 4 — Dashboard, Notifications, Theme, Responsiveness, Polish

### Day 22 — Backend Analytics Aggregation Endpoints

Use MongoDB aggregation pipelines — this is the "systems thinking" flex of the whole project.

```js
export const getAdminStats = async () => {
  const [appointmentsByStatus, revenueByMonth, topDoctors] = await Promise.all([
    Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, total: { $sum: "$total" } } },
      { $sort: { _id: 1 } },
    ]),
    Appointment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$doctor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "doctor" } },
      { $unwind: "$doctor" },
      { $project: { "doctor.name": 1, "doctor.specialization": 1, count: 1 } },
    ]),
  ]);
  return { appointmentsByStatus, revenueByMonth, topDoctors };
};
```

**Checkpoint:** one endpoint returns everything the admin dashboard needs in a single round trip — avoid N+1 API calls from the frontend.

---

### Day 23 — Admin Dashboard UI (Charts)

**`client/app/(dashboard)/admin/page.tsx`**
```tsx
"use client";

import useSWR from "swr";
import { useApi } from "@/lib/api";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const { request } = useApi();
  const { data, isLoading } = useSWR("/api/analytics/admin", request);

  if (isLoading) return <div className="p-8">Loading dashboard…</div>;

  const kpis = [
    { label: "Total Patients", value: data.totalPatients },
    { label: "Total Doctors", value: data.totalDoctors },
    { label: "Today's Appointments", value: data.todayAppointments },
    { label: "Monthly Revenue", value: `$${data.monthlyRevenue?.toLocaleString() ?? 0}` },
  ];

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">Appointments by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.appointmentsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 font-semibold">Top 5 Doctors</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Doctor</th>
              <th>Specialization</th>
              <th>Completed Appointments</th>
            </tr>
          </thead>
          <tbody>
            {data.topDoctors.map((d: any) => (
              <tr key={d._id} className="border-b">
                <td className="py-2">{d.doctor.name}</td>
                <td>{d.doctor.specialization}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**`server/src/controllers/analyticsController.js`** — extend Day 22's aggregation service to also return the KPI card numbers:
```js
export const getAdminStats = catchAsync(async (req, res) => {
  const [totalPatients, totalDoctors, todayAppointments, stats] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Appointment.countDocuments({ date: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) } }),
    analyticsService.getAdminStats(), // appointmentsByStatus, revenueByMonth, topDoctors — from Day 22
  ]);
  const monthlyRevenue = stats.revenueByMonth.at(-1)?.total ?? 0;
  res.json({ totalPatients, totalDoctors, todayAppointments, monthlyRevenue, ...stats });
});
```

**Doctor's own dashboard** (`client/app/(dashboard)/doctor/page.tsx`) — simpler, no charts needed, just today's list (reuses the `getTodaySchedule` endpoint from Day 14):
```tsx
"use client";
import useSWR from "swr";
import { useApi } from "@/lib/api";

export default function DoctorDashboard() {
  const { request } = useApi();
  const { data: schedule } = useSWR("/api/appointments/today", request);

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Today's Schedule</h1>
      <div className="grid gap-3">
        {schedule?.length ? schedule.map((a: any) => (
          <div key={a._id} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{a.patient.name}</p>
              <p className="text-sm text-muted-foreground">{a.time} — {a.reason || "General visit"}</p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs">{a.status}</span>
          </div>
        )) : <p className="text-muted-foreground">No appointments today.</p>}
      </div>
    </div>
  );
}
```

**Checkpoint:** `/admin` renders live charts and KPI cards from real aggregation data (not mock arrays), and `/doctor` shows the logged-in doctor's actual appointments for today, sorted by time.

---

### Day 24 — Receptionist & Patient Dashboards

**`client/app/(dashboard)/receptionist/page.tsx`**
```tsx
"use client";
import useSWR from "swr";
import Link from "next/link";
import { useApi } from "@/lib/api";

export default function ReceptionistDashboard() {
  const { request } = useApi();
  const { data } = useSWR("/api/dashboard/receptionist", request);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Front Desk</h1>
        <Link href="/receptionist/appointments/new" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          + Book Appointment
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Today's Appointments</p>
          <p className="text-2xl font-bold">{data?.todayCount ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-bold">{data?.pendingInvoices ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Checked-in Patients</p>
          <p className="text-2xl font-bold">{data?.checkedIn ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Today, Across All Doctors</h2>
        {data?.appointments?.map((a: any) => (
          <div key={a._id} className="flex justify-between border-b py-2 text-sm last:border-0">
            <span>{a.time} — {a.patient.name}</span>
            <span className="text-muted-foreground">Dr. {a.doctor.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`client/app/(dashboard)/patient/page.tsx`**
```tsx
"use client";
import useSWR from "swr";
import { useApi } from "@/lib/api";

export default function PatientDashboard() {
  const { request } = useApi();
  const { data } = useSWR("/api/dashboard/patient", request);

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Health</h1>

      {data?.upcomingAppointment ? (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Upcoming Appointment</p>
          <p className="font-medium">
            Dr. {data.upcomingAppointment.doctor.name} — {new Date(data.upcomingAppointment.date).toLocaleDateString()} at {data.upcomingAppointment.time}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-4 text-muted-foreground">No upcoming appointments.</div>
      )}

      {data?.outstandingInvoice && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="font-medium text-destructive">Outstanding balance: ${data.outstandingInvoice.total}</p>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Recent Prescriptions</h2>
        {data?.recentPrescriptions?.length ? data.recentPrescriptions.map((p: any) => (
          <div key={p._id} className="border-b py-2 text-sm last:border-0">
            {p.medicines.map((m: any) => m.name).join(", ")} — {new Date(p.issuedDate).toLocaleDateString()}
          </div>
        )) : <p className="text-sm text-muted-foreground">No prescriptions yet.</p>}
      </div>
    </div>
  );
}
```

**Backend — one combined endpoint per role dashboard** (avoids the N+1 client-side fetch problem from Day 22's note):
```js
export const getPatientDashboard = catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ clerkId: req.user.clerkId });
  const [upcomingAppointment, outstandingInvoice, recentPrescriptions] = await Promise.all([
    Appointment.findOne({ patient: patient._id, date: { $gte: new Date() }, status: { $in: ["pending", "confirmed"] } })
      .sort({ date: 1 }).populate("doctor", "name"),
    Invoice.findOne({ patient: patient._id, status: "unpaid" }),
    Prescription.find({ patient: patient._id }).sort({ issuedDate: -1 }).limit(5),
  ]);
  res.json({ upcomingAppointment, outstandingInvoice, recentPrescriptions });
});
```

**Checkpoint:** all 4 dashboards (`/admin`, `/doctor`, `/receptionist`, `/patient`) are functionally distinct, each fetching from its own single combined endpoint — no role sees a generic "one dashboard fits all" screen, and no dashboard makes more than one round trip to load.

---

### Day 25 — Notifications: Model + Triggers

**`server/src/models/Notification.js`**
```js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientClerkId: { type: String, required: true, index: true },
    type: { type: String, enum: ["appointment", "prescription", "invoice", "system"], required: true },
    title: String,
    message: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
```

Trigger notifications from the places you already built: appointment status change (Day 13), new prescription (Day 18), invoice created/paid (Day 19–20).

```js
export const createNotification = async ({ recipientClerkId, type, title, message, relatedId }) => {
  await Notification.create({ recipientClerkId, type, title, message, relatedId });
  // Optional: emit via a WebSocket/SSE channel here for real-time push
};
```

**Checkpoint:** cancelling an appointment creates a notification doc for the affected patient.

---

### Day 26 — Notification UI + Real-Time Delivery

Two viable approaches — pick one based on time budget:
1. **Simple (recommended for 30-day scope):** SWR/React Query polling every 15–30s on a `GET /notifications/unread-count` endpoint, bell icon with badge, dropdown list, mark-as-read on click.
2. **Real-time (stretch goal):** Server-Sent Events (SSE) endpoint on Express, `EventSource` on the client — genuinely real-time without the complexity of a full WebSocket server.

**Checkpoint:** a new notification appears in the bell dropdown without a full page reload.

---

### Day 27 — Light/Dark Theme + Full Responsive Pass

- `next-themes` (`ThemeProvider` already wired Day 2) + a theme toggle in the top nav using shadcn/ui `DropdownMenu`.
- Audit every page built so far at 3 breakpoints: mobile (375px), tablet (768px), desktop (1280px+). Sidebar nav collapses to a bottom tab bar or hamburger drawer on mobile — dashboards with charts stack vertically instead of a grid.
- Tailwind convention: build mobile-first (`className="flex flex-col md:flex-row"` etc.), don't retrofit.

**Checkpoint:** every role's dashboard and every CRUD table is usable without horizontal scroll on a 375px viewport, and dark mode has no unreadable-contrast regressions (check chart colors especially — Recharts needs explicit dark-mode-aware color props).

---

## Week 5 — Testing, Hardening, Deployment

### Day 28 — Testing Pass

- Backend: Jest + Supertest for controllers/services (this is why you kept services pure and DB-call-only — easy to mock). Cover: RBAC middleware (401/403 cases), booking race condition, invalid status transitions, invoice total calculation.
- Frontend: a handful of React Testing Library tests on critical forms (booking form validation, invite-doctor form).
- Manually walk each role end-to-end one more time as a fresh "user" — this catches more real bugs than unit tests at this stage.

```js
// example: server/src/tests/rbac.test.js
import request from "supertest";
import app from "../app.js";

describe("RBAC", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(401);
  });
});
```

**Checkpoint:** critical-path tests pass in CI (set up a basic GitHub Actions workflow running `npm test` on push).

---

### Day 29 — Security Hardening + Environment Prep

Checklist:
- `helmet()` already on (Day 1) — verify CSP isn't blocking Clerk's scripts once deployed.
- Rate limiting on auth-adjacent and booking endpoints (`express-rate-limit`) — prevents booking-spam abuse.
- Input validation with Zod/Joi on every mutating route — never trust `req.body` shape.
- Mongo injection: Mongoose largely protects you, but sanitize any raw `$where`/regex-from-user-input (your search endpoints, Day 8) — escape regex special characters.
- Secrets: confirm `.env` files are gitignored, rotate any keys you may have committed during dev.
- CORS: lock `origin` to your actual deployed frontend URL, not `*`.

```js
import rateLimit from "express-rate-limit";
export const bookingLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: "Too many booking attempts, slow down." });
```

**Checkpoint:** a quick `npm audit` and manual review of every route file confirms no route is missing `requireAuth`.

---

### Day 30 — Deployment

**Backend → Render or Railway (both have generous free tiers, simpler than raw EC2 for this scope):**
1. Push `server/` as its own deployable (or configure root directory if monorepo).
2. Set env vars: `MONGO_URI`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `CLOUDINARY_*`, `CLIENT_URL`.
3. Add a `Dockerfile` or use the platform's Node buildpack — either works at this scale.
4. Update Clerk webhook endpoint URL in the Clerk dashboard to point at your live backend URL (`https://your-api.onrender.com/api/webhooks/clerk`).

**Frontend → Vercel (native Next.js fit):**
1. Import the repo, set root directory to `client/`.
2. Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_URL` (your Render/Railway URL).
3. Add your Vercel domain to Clerk's allowed origins/redirect URLs.

**MongoDB Atlas:**
- Switch network access from your dev IP allowlist to `0.0.0.0/0` (or Render/Railway's static egress IP if the plan provides one) — document this tradeoff, it's a real production decision, not just a checkbox.

**Final smoke test on production:**
- Sign up as a patient → book an appointment → (as admin, separately) invite + accept a doctor → complete the appointment → verify medical record, prescription, invoice, and notification all fire correctly, live.

**Checkpoint (project complete):** a stranger with no context can sign up, get routed to the correct dashboard, and every role's core workflow functions on the public URL — this is your portfolio piece.

---

## Appendix D — All Package Install Commands (grouped by the day you need them)

Run these from the correct folder (`client/` or `server/`). Nothing here is optional filler — every package maps to something used earlier in the guide.

### Server (`cd server`)

**Day 1 — core server + DB**
```bash
npm init -y
npm install express mongoose dotenv cors helmet morgan
npm install -D nodemon
```

**Day 4–6 — auth**
```bash
npm install @clerk/backend
```

**Day 5 — webhooks**
```bash
npm install svix
```

**Day 8 — validation**
```bash
npm install zod
```
*(or `npm install joi` if you prefer Joi over Zod — the guide's validation-layer step works with either, pick one and stay consistent)*

**Day 15 — file uploads**
```bash
npm install multer cloudinary
```

**Day 20 (optional stretch) — payments**
```bash
npm install stripe
```

**Day 18 (optional stretch) — PDF generation**
```bash
npm install pdfkit
# or: npm install @react-pdf/renderer   (if generating PDFs server-side via React components)
```

**Day 29 — security hardening**
```bash
npm install express-rate-limit express-mongo-sanitize
```

**Day 28 — testing**
```bash
npm install -D jest supertest cross-env
```

**One-shot: everything the server needs, all at once**
```bash
npm install express mongoose dotenv cors helmet morgan @clerk/backend svix zod multer cloudinary stripe pdfkit express-rate-limit express-mongo-sanitize
npm install -D nodemon jest supertest cross-env
```

**`server/package.json` scripts block**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "cross-env NODE_ENV=test jest --runInBand"
}
```

---

### Client (`cd client`)

**Day 2 — scaffold (this one command sets up Next.js + TypeScript + Tailwind + App Router together)**
```bash
npx create-next-app@latest client
# When prompted: TypeScript = Yes, ESLint = Yes, Tailwind = Yes, src/ dir = your choice, App Router = Yes
cd client
```

**Day 2 — auth**
```bash
npm install @clerk/nextjs
```

**Day 6 — dashboard shell (sidebar icons + class merging)**
```bash
npm install lucide-react clsx tailwind-merge
```
*(`clsx`/`tailwind-merge` are usually already installed by `npx shadcn@latest init` — only run this if `client/lib/utils.ts` and its `cn()` helper don't already exist.)*

**Day 8 — data fetching + forms**
```bash
npm install swr
npm install react-hook-form @hookform/resolvers zod
```

**Day 8+ — UI components (shadcn/ui — this is a CLI that adds components on demand, not one big install)**
```bash
npx shadcn@latest init
# then, as you need each component through the guide:
npx shadcn@latest add button input table card dialog dropdown-menu badge accordion form select
```

**Day 17 — dates**
```bash
npm install date-fns
```

**Day 23 — charts**
```bash
npm install recharts
```

**Day 27 — theme toggle**
```bash
npm install next-themes
```

**Day 18 (optional stretch) — client-side PDF receipts/prescriptions**
```bash
npm install @react-pdf/renderer
```

**Day 20 (optional stretch) — Stripe on the frontend**
```bash
npm install @stripe/stripe-js
```

**Day 28 — frontend testing**
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

**One-shot: everything the client needs, all at once (after `create-next-app` and `shadcn init`)**
```bash
npm install @clerk/nextjs lucide-react clsx tailwind-merge swr react-hook-form @hookform/resolvers zod date-fns recharts next-themes @react-pdf/renderer @stripe/stripe-js
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

---

### Quick reference — what each package is actually for

| Package | Used for |
|---|---|
| `express` | HTTP server / routing |
| `mongoose` | MongoDB ODM, schemas |
| `dotenv` | load `.env` vars |
| `cors` | allow client origin to call the API |
| `helmet` | security headers |
| `morgan` | request logging in dev |
| `nodemon` | auto-restart server on file change (dev only) |
| `@clerk/backend` | verify Clerk JWTs, manage users/invitations server-side |
| `@clerk/nextjs` | Clerk UI components + client/server auth helpers |
| `svix` | verify Clerk webhook signatures |
| `zod` | request body / form validation (shared shape on client + server) |
| `multer` | parse multipart file uploads |
| `cloudinary` | image/file storage + delivery |
| `stripe` / `@stripe/stripe-js` | online payments (optional) |
| `pdfkit` / `@react-pdf/renderer` | generate downloadable PDFs (optional) |
| `express-rate-limit` | throttle abuse-prone endpoints |
| `express-mongo-sanitize` | strip Mongo operator injection from user input |
| `jest` / `supertest` | backend testing |
| `swr` | client-side data fetching, caching, revalidation |
| `react-hook-form` + `@hookform/resolvers` | form state + validation wiring |
| `shadcn/ui` (via CLI) | accessible, unstyled-then-styled UI primitives |
| `lucide-react` | icon set used in the dashboard sidebar (Day 6) |
| `clsx` + `tailwind-merge` | the `cn()` helper — merges conditional Tailwind classes without conflicts |
| `date-fns` | date formatting/manipulation |
| `recharts` | dashboard charts |
| `next-themes` | light/dark theme switching |
| `@testing-library/react` | frontend component tests |

---

## Appendix E — Postman Collection Structure (build this once, add to it as you go)

**Collection name:** `HMS API`

**Collection Variables** (set once at the collection level, under the Variables tab):

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:5000/api` |
| `adminToken` | Bearer token from a signed-in admin account |
| `doctorToken` | Bearer token from a signed-in doctor account |
| `receptionistToken` | Bearer token from a signed-in receptionist account |
| `patientToken` | Bearer token from a signed-in patient account |

Storing all 4 role tokens as variables means switching which role a request is tested as is just changing `{{adminToken}}` → `{{doctorToken}}` in that request's Authorization tab, instead of re-copying a fresh token from the browser every time.

**Folders to create, and the routes that go inside each** (matches Appendix A's route table exactly):

```
HMS API/
├── Health/
│   └── GET  {{baseUrl}}/../health
├── RBAC/                              (temporary — delete once Day 4's test route is removed)
│   ├── GET  {{baseUrl}}/test-protected   — No Token
│   ├── GET  {{baseUrl}}/test-protected   — Patient Token
│   └── GET  {{baseUrl}}/test-protected   — Admin Token
├── Patients/
│   ├── GET   {{baseUrl}}/patients?page=1&limit=10
│   ├── GET   {{baseUrl}}/patients/:id
│   └── PATCH {{baseUrl}}/patients/:id
├── Doctors/
│   ├── POST {{baseUrl}}/doctors/invite
│   ├── GET  {{baseUrl}}/doctors
│   ├── GET  {{baseUrl}}/doctors/:id
│   ├── GET  {{baseUrl}}/doctors/:id/availability
│   └── POST {{baseUrl}}/doctors/:id/availability
├── Appointments/
│   ├── GET   {{baseUrl}}/appointments
│   ├── GET   {{baseUrl}}/appointments/today
│   ├── POST  {{baseUrl}}/appointments
│   └── PATCH {{baseUrl}}/appointments/:id/status
├── Medical Records/
│   ├── GET   {{baseUrl}}/medical-records/patient/:patientId
│   ├── POST  {{baseUrl}}/medical-records
│   └── PATCH {{baseUrl}}/medical-records/:id
├── Prescriptions/
│   ├── POST {{baseUrl}}/prescriptions
│   └── GET  {{baseUrl}}/prescriptions/patient/:patientId
├── Billing/
│   ├── GET   {{baseUrl}}/invoices
│   └── PATCH {{baseUrl}}/invoices/:id/pay
├── Notifications/
│   ├── GET   {{baseUrl}}/notifications
│   └── PATCH {{baseUrl}}/notifications/:id/read
└── Dashboards & Analytics/
    ├── GET {{baseUrl}}/analytics/admin
    ├── GET {{baseUrl}}/dashboard/receptionist
    └── GET {{baseUrl}}/dashboard/patient
```

**Which token to use per request:** check that route's row in Appendix A — it tells you exactly which role(s) should get ✅/❌/Own for that endpoint, so you know which token(s) to actually test with rather than guessing.

**Path variables** (`:id`, `:patientId`, etc.) — set these as request-level or collection-level variables too (e.g. `{{testPatientId}}`) once you've seeded or created real data, so you're not hand-editing the URL every time you re-run a saved request.

---

## Appendix A — Full Route Map (exact per-role access — no route left ambiguous)

**Legend:** ✅ = full access · **Own** = only their own record / own patients treated / own bookings · ❌ = forbidden (403)

| Method | Route | Admin | Doctor | Receptionist | Patient |
|---|---|---|---|---|---|
| POST | `/api/webhooks/clerk` | — (Clerk system call, no user role, verified via svix signature instead) | | | |
| **Patients** |
| GET | `/api/patients` (list, paginated) | ✅ | ❌ | ✅ | ❌ |
| GET | `/api/patients/:id` | ✅ | Own (treated only) | ✅ | Own only |
| PATCH | `/api/patients/:id` | ✅ | ❌ | ✅ | Own only |
| **Doctors** |
| POST | `/api/doctors/invite` | ✅ | ❌ | ❌ | ❌ |
| GET | `/api/doctors` (list) | ✅ | ✅ | ✅ | ✅ |
| GET | `/api/doctors/:id` | ✅ | ✅ | ✅ | ✅ |
| GET | `/api/doctors/:id/availability` | ✅ | ✅ | ✅ | ✅ |
| POST | `/api/doctors/:id/availability` (set weekly schedule/leave) | ✅ | Own only | ❌ | ❌ |
| **Appointments** |
| GET | `/api/appointments` (list) | ✅ (all) | Own only | ✅ (all) | Own only |
| GET | `/api/appointments/today` (doctor's own schedule) | ❌ | Own only | ❌ | ❌ |
| POST | `/api/appointments` (book) | ✅ | ❌ | ✅ (for any patient) | ✅ (for self only) |
| PATCH | `/api/appointments/:id/status` | ✅ (any transition) | Own only, and only `confirmed→completed` / `→no-show` | Own bookings, `pending→confirmed` / `→cancelled` only | Own only, `→cancelled` only, before `confirmed` |
| **Medical Records** |
| GET | `/api/medical-records/patient/:patientId` | ✅ (read-only) | Own patients only (must have appointment history) | ❌ | Own only |
| POST | `/api/medical-records` | ❌ | ✅ (own patients only) | ❌ | ❌ |
| PATCH | `/api/medical-records/:id` | ❌ | Own records only | ❌ | ❌ |
| **Prescriptions** |
| POST | `/api/prescriptions` | ❌ | ✅ (own patients only) | ❌ | ❌ |
| GET | `/api/prescriptions/patient/:patientId` | ✅ (read-only) | Own patients only | ❌ | Own only |
| **Billing** |
| GET | `/api/invoices` | ✅ (all) | ❌ | ✅ (all) | Own only |
| PATCH | `/api/invoices/:id/pay` | ✅ | ❌ | ✅ | ❌ |
| **Notifications** |
| GET | `/api/notifications` | Own only | Own only | Own only | Own only |
| PATCH | `/api/notifications/:id/read` | Own only | Own only | Own only | Own only |
| **Dashboards & Analytics** |
| GET | `/api/analytics/admin` | ✅ | ❌ | ❌ | ❌ |
| GET | `/api/dashboard/receptionist` | ❌ | ❌ | ✅ (own view, all doctors' today) | ❌ |
| GET | `/api/dashboard/patient` | ❌ | ❌ | ❌ | Own only |

**Why "Own" isn't just a role check.** Notice how many rows say "Own" rather than a flat ✅/❌ — that's the ownership layer from Day 8/16 stacked on top of the role check from Day 4. A route being open to the `doctor` role doesn't mean *every* doctor can hit it for *any* patient — the controller has to additionally verify `req.user.clerkId` matches (or has a treatment relationship with) the resource being requested. RBAC middleware answers "is this role allowed to call this endpoint at all"; the controller-level ownership check answers "is this specific caller allowed to touch this specific document." Every route in this table needs both, not just the first one.

**How to use this table while building:** before writing any route from Day 8 onward, find its row here first, then implement exactly what the row says — no route should ship with looser or vaguer access than what's listed. If you build a route not in this table, add a row for it before moving on, so this stays the single source of truth for RBAC across the whole project.

---

## Appendix B — Daily Time Budget (realistic for a solo builder)

| Days | Avg. hours/day | Why |
|---|---|---|
| 1–7 | 3–4 | Auth/RBAC is genuinely the hardest part; don't rush it |
| 8–14 | 2–3 | Repetitive CRUD once the pattern clicks |
| 15–21 | 2.5–3 | Access-control nuance slows you down a bit |
| 22–27 | 2–3 | UI-heavy, more visually rewarding, moves fast |
| 28–30 | 3–4 | Deployment always eats more time than expected — budget for it |

## Appendix C — What to Cut If You're Short on Time

Priority order if Day 20 arrives and you're behind schedule: keep Auth/RBAC, Appointments, and one dashboard non-negotiable. Cut, in this order: real-time notifications (fall back to polling or even just an in-app list with no push), Stripe integration (keep billing manual/cash-only), PDF prescription export, automated tests (do a manual QA pass instead), multi-chart analytics (ship 2 charts, not 5).

---

*Keep an ADR (Architecture Decision Record) file in `docs/` — one paragraph per major decision (why Clerk over NextAuth, why separate services from controllers, why compound unique index over app-level locking). It's a great thing to point to in interviews and it costs you five minutes a day.*
