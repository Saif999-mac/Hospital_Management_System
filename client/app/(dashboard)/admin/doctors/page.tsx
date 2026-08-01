import { InviteDoctorForm } from "@/components/invite-doctor-form";
import { DoctorsTable } from "@/components/doctors-table";

export default function AdminDoctorsPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Doctors</h1>
      <DoctorsTable />
      <InviteDoctorForm />
    </div>
  );
}
