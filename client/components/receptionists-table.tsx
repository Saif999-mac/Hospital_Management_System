"use client";

import useSWR from "swr";
import { useApi } from "@/lib/api";

export function ReceptionistsTable() {
  const { request } = useApi();
  const { data: receptionists, isLoading } = useSWR("/receptionists", request);

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">Department</th>
            <th className="p-3">Shift</th>
          </tr>
        </thead>
        <tbody>
          {receptionists?.map((r: any) => (
            <tr key={r._id} className="border-b last:border-0">
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3 text-muted-foreground">
                {r.assignedDepartment}
              </td>
              <td className="p-3 text-muted-foreground capitalize">
                {r.shift}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!receptionists?.length && (
        <p className="p-3 text-sm text-muted-foreground">
          No receptionists yet.
        </p>
      )}
    </div>
  );
}
