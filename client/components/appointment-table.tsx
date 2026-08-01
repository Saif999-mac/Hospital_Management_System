"use client";

import useSWR from "swr";
import { useState } from "react";
import { useApi } from "@/lib/api";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  "no-show": "bg-red-100 text-red-800",
};

export function AppointmentTable({
  role,
}: {
  role: "admin" | "doctor" | "receptionist" | "patient";
}) {
  const { request } = useApi();
  const {
    data: appointments,
    isLoading,
    mutate,
  } = useSWR("/appointments", request);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const updateStatus = async (id: string, status: string) => {
    setActioningId(id);
    setError("");
    try {
      await request(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      mutate(); // re-fetch the list so the UI reflects the new status immediately
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Date / Time</th>
              {role !== "patient" && <th className="p-3">Patient</th>}
              {role !== "doctor" && <th className="p-3">Doctor</th>}
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments?.map((a: any) => (
              <tr key={a._id} className="border-b last:border-0">
                <td className="p-3">
                  {new Date(a.date).toLocaleDateString()} — {a.time}
                </td>
                {role !== "patient" && (
                  <td className="p-3">
                    {role === "doctor" ? (
                      <Link
                        href={`/doctor/patients/${a.patient?._id}/records`}
                        className="hover:underline"
                      >
                        {a.patient?.name}
                      </Link>
                    ) : (
                      a.patient?.name
                    )}
                  </td>
                )}
                {role !== "doctor" && (
                  <td className="p-3">Dr. {a.doctor?.name}</td>
                )}
                <td className="p-3 text-muted-foreground">{a.reason || "—"}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[a.status]}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  {/* Doctor: can mark completed or no-show, only from confirmed */}
                  {role === "doctor" && a.status === "confirmed" && (
                    <>
                      <button
                        disabled={actioningId === a._id}
                        onClick={() => updateStatus(a._id, "completed")}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        Complete
                      </button>
                      <button
                        disabled={actioningId === a._id}
                        onClick={() => updateStatus(a._id, "no-show")}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        No-show
                      </button>
                    </>
                  )}
                  {/* Receptionist/Admin: confirm a pending booking */}
                  {(role === "receptionist" || role === "admin") &&
                    a.status === "pending" && (
                      <button
                        disabled={actioningId === a._id}
                        onClick={() => updateStatus(a._id, "confirmed")}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                      >
                        Confirm
                      </button>
                    )}
                  {/* Cancel: available to admin/receptionist any time before completed;
                      patient only before it's confirmed */}
                  {["admin", "receptionist"].includes(role) &&
                    !["completed", "cancelled"].includes(a.status) && (
                      <button
                        disabled={actioningId === a._id}
                        onClick={() => updateStatus(a._id, "cancelled")}
                        className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent"
                      >
                        Cancel
                      </button>
                    )}
                  {role === "patient" && a.status === "pending" && (
                    <button
                      disabled={actioningId === a._id}
                      onClick={() => updateStatus(a._id, "cancelled")}
                      className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!appointments?.length && (
        <p className="text-sm text-muted-foreground">No appointments yet.</p>
      )}
    </div>
  );
}
