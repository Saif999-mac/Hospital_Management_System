"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useApi } from "@/lib/api";

export default function PatientProfilePage() {
  const { request } = useApi();
  const { data: patient, mutate } = useSWR("/patients/me", request);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (patient) setForm(patient);
  }, [patient]);

  if (!form) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await request("/patients/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          address: form.address,
        }),
      });
      mutate();
      setMessage("Profile updated.");
    } catch (err: any) {
      setMessage(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-4 p-8">
      <h1 className="text-2xl font-bold">My Profile</h1>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Gender</label>
          <select
            value={form.gender || ""}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Blood Group</label>
          <input
            value={form.bloodGroup || ""}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Address</label>
          <textarea
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
