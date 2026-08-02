"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityCalendar } from "@/components/bookings/availability-calendar";

export function BookingForm({ carId }: { carId: string }) {
  const router = useRouter();
  const { data: car, isLoading } = trpc.cars.getById.useQuery({ id: carId });
  const utils = trpc.useUtils();

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (booking) => {
      toast.success("Booking request submitted!");
      utils.bookings.listMine.invalidate();
      router.push(`/dashboard/bookings/${booking.id}?created=1`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const days = useMemo(() => {
    const diff =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const total = car ? (Number(car.pricePerDay) * days).toFixed(2) : null;

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!car) {
    return <p className="text-muted-foreground">Car not found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar carId={carId} />
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>
            Book {car.make} {car.model} ({car.year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createBooking.mutate({ carId, startDate, endDate });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            {total && days > 0 && (
              <p className="text-sm text-muted-foreground">
                {days} day{days > 1 ? "s" : ""} × ${car.pricePerDay}/day ={" "}
                <span className="font-semibold text-foreground">${total}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Your request will be reviewed before it&apos;s confirmed.
            </p>
            <Button type="submit" className="w-full" disabled={createBooking.isPending || days <= 0}>
              {createBooking.isPending ? "Submitting..." : "Request Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
