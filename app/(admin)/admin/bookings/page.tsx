import { AdminBookingsTable } from "@/components/admin/bookings-table";

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Bookings</h1>
      <AdminBookingsTable />
    </div>
  );
}
