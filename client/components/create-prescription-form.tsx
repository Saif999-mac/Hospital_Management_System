"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const emptyMedicine: Medicine = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

export function CreatePrescriptionForm({
  patientId,
  medicalRecordId,
  onSuccess,
}: {
  patientId: string;
  medicalRecordId: string;
  onSuccess?: () => void;
}) {
  const { request } = useApi();
  const [medicines, setMedicines] = useState<Medicine[]>([
    { ...emptyMedicine },
  ]);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const updateMedicine = (
    index: number,
    field: keyof Medicine,
    value: string,
  ) => {
    setMedicines((meds) =>
      meds.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const addMedicine = () =>
    setMedicines((meds) => [...meds, { ...emptyMedicine }]);
  const removeMedicine = (index: number) =>
    setMedicines((meds) => meds.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      await request("/prescriptions", {
        method: "POST",
        body: JSON.stringify({ patientId, medicalRecordId, medicines }),
      });
      setMedicines([{ ...emptyMedicine }]);
      setMessage("Prescription created.");
      onSuccess?.();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to create prescription.");
    } finally {
      setStatus("idle");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
      <h2 className="font-semibold">New Prescription</h2>
      {message && (
        <p
          className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}

      <div className="space-y-4">
        {medicines.map((med, i) => (
          <div key={i} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Medicine {i + 1}</span>
              {medicines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedicine(i)}
                  className="text-xs text-destructive"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Name"
                value={med.name}
                onChange={(e) => updateMedicine(i, "name", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <input
                placeholder="Dosage (e.g. 500mg)"
                value={med.dosage}
                onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <input
                placeholder="Frequency (e.g. twice daily)"
                value={med.frequency}
                onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <input
                placeholder="Duration (e.g. 5 days)"
                value={med.duration}
                onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <input
                placeholder="Instructions (e.g. after food)"
                value={med.instructions}
                onChange={(e) =>
                  updateMedicine(i, "instructions", e.target.value)
                }
                className="col-span-2 rounded-md border px-2 py-1 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMedicine}
        className="text-sm text-primary underline"
      >
        + Add another medicine
      </button>

      <button
        type="submit"
        disabled={status === "saving"}
        className="block w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Create Prescription"}
      </button>
    </form>
  );
}
