import { MyPaymentsTable } from "@/components/payments/my-payments-table";

export default function MyPaymentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Payments</h1>
      <MyPaymentsTable />
    </div>
  );
}
