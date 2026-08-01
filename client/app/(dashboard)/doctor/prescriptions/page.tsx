"use client";

import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { useApi } from "@/lib/api";

export default function DoctorPrescriptionsPage() {
  const { request } = useApi();
  const { data: prescriptions, isLoading } = useSWR(
    "/prescriptions/mine",
    request,
  );

  return (
    <div className="max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Prescriptions I've Written</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !prescriptions?.length ? (
        <p className="text-muted-foreground">No prescriptions written yet.</p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p: any) => (
            <div key={p._id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <Link
                  href={`/doctor/patients/${p.patient?._id}/records`}
                  className="font-medium hover:underline"
                >
                  {p.patient?.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(p.issuedDate), "MMM d, yyyy")}
                </span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {p.medicines.map((m: any, i: number) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">
                      {m.name}
                    </span>
                    {m.dosage && ` — ${m.dosage}`}
                    {m.frequency && `, ${m.frequency}`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
