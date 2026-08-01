import { InvoiceTable } from "@/components/invoice-table";
export default function AdminBillingPage() {
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-bold">Billing</h1>
      <InvoiceTable role="admin" />
    </div>
  );
}
