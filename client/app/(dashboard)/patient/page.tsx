"use client";
import useSWR from "swr";
import { useApi } from "@/lib/api";

export default function PatientDashboard() {
  const { request } = useApi();
  const { data } = useSWR("/dashboard/patient", request);

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Health</h1>

      {data?.upcomingAppointment ? (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Upcoming Appointment</p>
          <p className="font-medium">
            Dr. {data.upcomingAppointment.doctor.name} —{" "}
            {new Date(data.upcomingAppointment.date).toLocaleDateString()} at{" "}
            {data.upcomingAppointment.time}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-4 text-muted-foreground">
          No upcoming appointments.
        </div>
      )}

      {data?.outstandingInvoice && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="font-medium text-destructive">
            Outstanding balance: ${data.outstandingInvoice.total}
          </p>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Recent Prescriptions</h2>
        {data?.recentPrescriptions?.length ? (
          data.recentPrescriptions.map((p: any) => (
            <div key={p._id} className="border-b py-2 text-sm last:border-0">
              {p.medicines.map((m: any) => m.name).join(", ")} —{" "}
              {new Date(p.issuedDate).toLocaleDateString()}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No prescriptions yet.</p>
        )}
      </div>
    </div>
  );
}
