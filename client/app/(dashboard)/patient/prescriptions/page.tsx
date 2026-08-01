"use client";

import useSWR from "swr";
import { useApi } from "@/lib/api";
import { PrescriptionList } from "@/components/prescription-list";

export default function PatientPrescriptionsPage() {
  const { request } = useApi();
  const { data: patient } = useSWR("/patients/me", request);

  return (
    <div className="max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Prescriptions</h1>
      {patient ? (
        <PrescriptionList patientId={patient._id} />
      ) : (
        <p className="text-muted-foreground">Loading...</p>
      )}
    </div>
  );
}
