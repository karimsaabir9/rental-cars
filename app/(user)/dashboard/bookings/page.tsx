import { MyBookingsTable } from "@/components/bookings/my-bookings-table";

export default function MyBookingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Bookings</h1>
      <MyBookingsTable />
    </div>
  );
}
