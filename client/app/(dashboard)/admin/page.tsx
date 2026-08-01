"use client";

import useSWR from "swr";
import { useApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const { request } = useApi();
  const { data, isLoading } = useSWR("/analytics/admin", request);

  if (isLoading) return <div className="p-8">Loading dashboard…</div>;

  const kpis = [
    { label: "Total Patients", value: data.totalPatients },
    { label: "Total Doctors", value: data.totalDoctors },
    { label: "Today's Appointments", value: data.todayAppointments },
    {
      label: "Monthly Revenue",
      value: `$${data.monthlyRevenue?.toLocaleString() ?? 0}`,
    },
  ];
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">Appointments by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.appointmentsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 font-semibold">Top 5 Doctors</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Doctor</th>
              <th>Specialization</th>
              <th>Completed Appointments</th>
            </tr>
          </thead>
          <tbody>
            {data.topDoctors.map((d: any) => (
              <tr key={d._id} className="border-b">
                <td className="py-2">{d.doctor.name}</td>
                <td>{d.doctor.specialization}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
