import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { getServerCaller } from "@/trpc/server";
import { BookingDetailView } from "@/components/bookings/booking-detail-view";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await getServerCaller();
  const booking = await caller.bookings.getById({ id }).catch((error) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Booking details</h1>
      <BookingDetailView booking={booking} justCreated={false} isOwner={false} />
    </div>
  );
}
