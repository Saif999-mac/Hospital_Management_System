import { AppointmentTable } from "@/components/appointment-table";
export default function ReceptionistAppointmentsPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <AppointmentTable role="receptionist" />
    </div>
  );
}
