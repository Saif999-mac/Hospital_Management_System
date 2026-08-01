"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";

export function InviteDoctorForm() {
  const { request } = useApi();
  const [form, setForm] = useState({
    name: "",
    email: "",
    specialization: "",
    consultationFee: "",
    department: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      await request("/doctors/invite", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          consultationFee: Number(form.consultationFee),
        }),
      });
      setStatus("sent");
      setMessage(`Invitation sent to ${form.email}.`);
      setForm({
        name: "",
        email: "",
        specialization: "",
        consultationFee: "",
        department: "",
      });
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to send invitation.");
    }
  };
  return (
    <div className=" flex mx-auto  justify-center">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full space-y-4 rounded-lg border p-6 "
      >
        <h2 className="font-semibold">Invite a Doctor</h2>
        {message && (
          <p
            className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {message}
          </p>
        )}
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Specialization</label>
          <input
            required
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Consultation Fee</label>
          <input
            type="number"
            required
            value={form.consultationFee}
            onChange={(e) =>
              setForm({ ...form, consultationFee: e.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Department</label>
          <input
            required
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50 cursor-pointer"
        >
          {status === "sending" ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
