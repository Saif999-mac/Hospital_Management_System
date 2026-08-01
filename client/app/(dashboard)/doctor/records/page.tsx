"use client";

import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { useApi } from "@/lib/api";

export default function DoctorMedicalRecordsPage() {
  const { request } = useApi();
  const { data: records, isLoading } = useSWR("/medical-records/mine", request);

  return (
    <div className="max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Medical Records I've Written</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !records?.length ? (
        <p className="text-muted-foreground">No records yet.</p>
      ) : (
        <div className="space-y-3">
          {records.map((r: any) => (
            <Link
              key={r._id}
              href={`/doctor/patients/${r.patient?._id}/records`}
              className="block rounded-lg border p-4 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.patient?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(r.visitDate), "MMM d, yyyy")}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.diagnosis}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
