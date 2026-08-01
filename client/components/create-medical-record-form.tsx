"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";

export function CreateMedicalRecordForm({
  patientId,
  onSuccess,
}: {
  patientId: string;
  onSuccess?: () => void;
}) {
  const { request } = useApi();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    temperature: "",
    pulse: "",
    weight: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("diagnosis", diagnosis);
    formData.append("notes", notes);
    formData.append(
      "symptoms",
      JSON.stringify(
        symptomsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

    // Strip out any vitals field left blank — an empty string can't be cast to
    // Number by the schema, so only send fields that actually have a value.
    const cleanedVitals = Object.fromEntries(
      Object.entries(vitals).filter(([, value]) => value !== ""),
    );
    formData.append("vitals", JSON.stringify(cleanedVitals));

    if (file) formData.append("attachment", file);

    try {
      const token = await (window as any).Clerk?.session?.getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/medical-records`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (!res.ok)
        throw new Error((await res.json()).message || "Failed to save.");

      setDiagnosis("");
      setNotes("");
      setSymptomsInput("");
      setVitals({ bloodPressure: "", temperature: "", pulse: "", weight: "" });
      setFile(null);
      setMessage("Medical record created.");
      onSuccess?.();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to create record.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
      <h2 className="font-semibold">New Medical Record</h2>
      {message && (
        <p
          className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}

      <div>
        <label className="text-sm font-medium">Diagnosis</label>
        <input
          required
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">
          Symptoms (comma-separated)
        </label>
        <input
          value={symptomsInput}
          onChange={(e) => setSymptomsInput(e.target.value)}
          placeholder="cough, fever"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Blood Pressure (e.g. 120/80)"
          value={vitals.bloodPressure}
          onChange={(e) =>
            setVitals({ ...vitals, bloodPressure: e.target.value })
          }
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.1"
          placeholder="Temperature (°F)"
          value={vitals.temperature}
          onChange={(e) =>
            setVitals({ ...vitals, temperature: e.target.value })
          }
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Pulse (bpm)"
          value={vitals.pulse}
          onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={vitals.weight}
          onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Attachment (optional)</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 w-full text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Create Record"}
      </button>
    </form>
  );
}
