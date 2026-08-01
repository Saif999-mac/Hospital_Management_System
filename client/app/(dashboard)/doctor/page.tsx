"use client";
import useSWR from "swr";
import { useApi } from "@/lib/api";

export default function DoctorDashboard() {
  const { request } = useApi();
  const { data: schedule } = useSWR("/appointments/today", request);

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Today's Schedule</h1>
      <div className="grid gap-3">
        {schedule?.length ? (
          schedule.map((a: any) => (
            <div
              key={a._id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{a.patient.name}</p>
                <p className="text-sm text-muted-foreground">
                  {a.time} — {a.reason || "General visit"}
                </p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs">
                {a.status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No appointments today.</p>
        )}
      </div>
    </div>
  );
}
