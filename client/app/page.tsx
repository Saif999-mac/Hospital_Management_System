import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/redirect");
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between px-8 py-6">
        <span className="text-xl font-bold">MediCare HMS</span>
        <div className="flex gap-3">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Hospital management, built around every role that keeps care running
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Book appointments, manage records, and coordinate care — one platform
          for admins, doctors, receptionists, and patients.
        </p>
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
          >
            Create an account
          </Link>
          <Link
            href="/sign-in"
            className="rounded-md border px-6 py-3 font-medium hover:bg-accent"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 px-8 py-16 md:grid-cols-4">
        {[
          {
            title: "Book Appointments",
            desc: "Real-time availability, no double-booking.",
          },
          {
            title: "Medical Records",
            desc: "Secure, role-scoped patient history.",
          },
          {
            title: "Prescriptions & Billing",
            desc: "From diagnosis to invoice, tracked end to end.",
          },
          {
            title: "Live Dashboards",
            desc: "Role-specific insight, not one generic view.",
          },
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
