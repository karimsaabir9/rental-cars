import { AdminPaymentsTable } from "@/components/admin/payments-table";

export default function AdminPaymentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Payments</h1>
      <AdminPaymentsTable />
    </div>
  );
}
