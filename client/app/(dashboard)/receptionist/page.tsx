"use client";
import useSWR from "swr";
import Link from "next/link";
import { useApi } from "@/lib/api";

export default function ReceptionistDashboard() {
  const { request } = useApi();
  const { data } = useSWR("/dashboard/receptionist", request);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Front Desk</h1>
        <Link
          href="/receptionist/appointments/new"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
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
          <div
            key={a._id}
            className="flex justify-between border-b py-2 text-sm last:border-0"
          >
            <span>
              {a.time} — {a.patient.name}
            </span>
            <span className="text-muted-foreground">Dr. {a.doctor.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
