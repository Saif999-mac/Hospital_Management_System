"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useApi } from "@/lib/api";
import { MedicalRecordTimeline } from "@/components/medical-record-timeline";
import { PrescriptionList } from "@/components/prescription-list";
import { CreatePrescriptionForm } from "@/components/create-prescription-form";
import { CreateMedicalRecordForm } from "@/components/create-medical-record-form";

export default function DoctorPatientRecordsPage() {
  const { id } = useParams();
  const { request } = useApi();

  // Fetch the records list here too, so we can grab the most recent record's _id
  // to pass into CreatePrescriptionForm — records are already sorted newest-first
  // by the service (visitDate: -1), so records[0] is the most recent visit.
  const { data: records } = useSWR(
    id ? `/medical-records/patient/${id}` : null,
    request,
  );
  const mostRecentRecordId = records?.[0]?._id;

  return (
    <div className="max-w-2xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">Patient Medical History</h1>
        <MedicalRecordTimeline patientId={id as string} />
      </div>
      <div>
        <h2 className="mb-3 text-xl font-bold">New Visit</h2>
        <CreateMedicalRecordForm patientId={id as string} />
      </div>

      <div>
        <h2 className="mb-3 text-xl font-bold">Prescriptions</h2>
        <PrescriptionList patientId={id as string} />
      </div>

      <div>
        <h2 className="mb-3 text-xl font-bold">Write a Prescription</h2>
        {mostRecentRecordId ? (
          <CreatePrescriptionForm
            patientId={id as string}
            medicalRecordId={mostRecentRecordId}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Create a medical record for this patient first — a prescription
            needs to be tied to a visit.
          </p>
        )}
      </div>
    </div>
  );
}
