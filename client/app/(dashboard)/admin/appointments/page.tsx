import { AppointmentTable } from "@/components/appointment-table";
export default function AdminAppointmentsPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <AppointmentTable role="admin" />
    </div>
  );
}
