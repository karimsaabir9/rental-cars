import { redirect } from "next/navigation";
import { BookingForm } from "@/components/bookings/booking-form";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ carId?: string }>;
}) {
  const { carId } = await searchParams;

  if (!carId) {
    redirect("/cars");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Booking</h1>
      <BookingForm carId={carId} />
    </div>
  );
}
