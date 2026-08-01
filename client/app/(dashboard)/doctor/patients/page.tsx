"use client";

import Link from "next/link";
import useSWR from "swr";
import { useApi } from "@/lib/api";

export default function DoctorMyPatientsPage() {
  const { request } = useApi();
  const { data: patients, isLoading } = useSWR(
    "/appointments/my-patients",
    request,
  );

  return (
    <div className="max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Patients</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !patients?.length ? (
        <p className="text-muted-foreground">No patients yet.</p>
      ) : (
        <div className="rounded-lg border">
          {patients.map((p: any) => (
            <Link
              key={p._id}
              href={`/doctor/patients/${p._id}/records`}
              className="flex items-center justify-between border-b p-4 text-sm last:border-0 hover:bg-accent"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">{p.email}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
