import Link from "next/link";
import { AppointmentTable } from "@/components/appointment-table";

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <Link
          href="/patient/appointments/book"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          + Book Appointment
        </Link>
      </div>
      <AppointmentTable role="patient" />
    </div>
  );
}
