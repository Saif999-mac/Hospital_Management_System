import { AppointmentTable } from "@/components/appointment-table";
export default function DoctorAppointmentsPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Appointments</h1>
      <AppointmentTable role="doctor" />
    </div>
  );
}
