"use client";

import useSWR from "swr";
import { format } from "date-fns";
import { useApi } from "@/lib/api";

export function PrescriptionList({ patientId }: { patientId: string }) {
  const { request } = useApi();
  const { data: prescriptions, isLoading } = useSWR(
    patientId ? `/prescriptions/patient/${patientId}` : null,
    request,
  );

  if (isLoading)
    return <p className="text-muted-foreground">Loading prescriptions...</p>;
  if (!prescriptions?.length)
    return <p className="text-muted-foreground">No prescriptions yet.</p>;

  return (
    <div className="space-y-3">
      {prescriptions.map((p: any) => (
        <div key={p._id} className="rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Dr. {p.doctor?.name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(p.issuedDate), "MMM d, yyyy")}
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            {p.medicines.map((m: any, i: number) => (
              <li key={i} className="text-muted-foreground">
                <span className="font-medium text-foreground">{m.name}</span>
                {m.dosage && ` — ${m.dosage}`}
                {m.frequency && `, ${m.frequency}`}
                {m.duration && `, ${m.duration}`}
                {m.instructions && (
                  <span className="italic"> ({m.instructions})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
