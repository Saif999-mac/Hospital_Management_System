"use client";

import useSWR from "swr";
import { useApi } from "@/lib/api";

export function DoctorsTable() {
  const { request } = useApi();
  const { data: doctors, isLoading } = useSWR("/doctors", request);

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-3">Name</th>
            <th className="p-3">Specialization</th>
            <th className="p-3">Department</th>
            <th className="p-3">Fee</th>
          </tr>
        </thead>
        <tbody>
          {doctors?.map((d: any) => (
            <tr key={d._id} className="border-b last:border-0">
              <td className="p-3 font-medium">{d.name}</td>
              <td className="p-3 text-muted-foreground">{d.specialization}</td>
              <td className="p-3 text-muted-foreground">{d.department}</td>
              <td className="p-3 text-muted-foreground">
                ${d.consultationFee}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!doctors?.length && (
        <p className="p-3 text-sm text-muted-foreground">No doctors yet.</p>
      )}
    </div>
  );
}
