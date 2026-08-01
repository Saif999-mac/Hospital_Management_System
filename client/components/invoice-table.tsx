"use client";

import useSWR from "swr";
import { useState } from "react";
import { useApi } from "@/lib/api";

export function InvoiceTable({
  role,
}: {
  role: "admin" | "receptionist" | "patient";
}) {
  const { request } = useApi();
  const { data: invoices, isLoading, mutate } = useSWR("/invoices", request);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [method, setMethod] = useState("cash");
  const [error, setError] = useState("");
  const handleMarkPaid = async (id: string) => {
    setError("");
    try {
      await request(`/invoices/${id}/pay`, {
        method: "PATCH",
        body: JSON.stringify({ paymentMethod: method }),
      });
      setPayingId(null);
      mutate(); // instant refetch — this is what makes the patient's view update without polling
    } catch (err: any) {
      setError(err.message || "Failed to update invoice.");
    }
  };
  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!invoices?.length)
    return <p className="text-muted-foreground">No invoices yet.</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              {role !== "patient" && <th className="p-3">Patient</th>}
              <th className="p-3">Description</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              {role !== "patient" && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv._id} className="border-b last:border-0">
                {role !== "patient" && (
                  <td className="p-3">{inv.patient?.name}</td>
                )}
                <td className="p-3 text-muted-foreground">
                  {inv.items.map((i: any) => i.description).join(", ")}
                </td>
                <td className="p-3 font-medium">${inv.total}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                {role !== "patient" && (
                  <td className="p-3">
                    {inv.status === "unpaid" &&
                      (payingId === inv._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="rounded-md border px-2 py-1 text-xs"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="online">Online</option>
                            <option value="insurance">Insurance</option>
                          </select>
                          <button
                            onClick={() => handleMarkPaid(inv._id)}
                            className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setPayingId(null)}
                            className="text-xs text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPayingId(inv._id)}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                        >
                          Mark Paid
                        </button>
                      ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
