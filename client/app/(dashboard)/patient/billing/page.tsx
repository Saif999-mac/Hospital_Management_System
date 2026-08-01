import { InvoiceTable } from "@/components/invoice-table";
export default function PatientBillingPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Bills</h1>
      <InvoiceTable role="patient" />
    </div>
  );
}
