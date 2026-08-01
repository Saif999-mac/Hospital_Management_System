import { InviteReceptionistForm } from "@/components/invite-receptionist-form";
import { ReceptionistsTable } from "@/components/receptionists-table";

export default function AdminReceptionistsPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Receptionists</h1>
      <ReceptionistsTable />
      <InviteReceptionistForm />
    </div>
  );
}
