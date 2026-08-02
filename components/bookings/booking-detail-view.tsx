"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car as CarIcon, CheckCircle2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingTimeline } from "@/components/bookings/booking-timeline";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT } from "@/lib/booking-status";
import type { RouterOutputs } from "@/trpc/routers/_app";

type Booking = RouterOutputs["bookings"]["getById"];

export function BookingDetailView({
  booking,
  justCreated,
  isOwner = true,
}: {
  booking: Booking;
  justCreated: boolean;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const cancelBooking = trpc.bookings.cancelMine.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled.");
      utils.bookings.getById.invalidate({ id: booking.id });
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const days =
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24) +
    1;

  return (
    <div className="max-w-3xl">
      {justCreated && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-medium">Booking request submitted</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              We&apos;ll notify you as soon as it&apos;s reviewed. You can track its status below.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Booking summary</CardTitle>
              <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                {BOOKING_STATUS_LABEL[booking.status]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {booking.car.imageUrl ? (
                    <Image
                      src={booking.car.imageUrl}
                      alt={`${booking.car.make} ${booking.car.model}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <CarIcon className="size-6 opacity-30" />
                    </div>
                  )}
                </div>
                <div>
                  <Link
                    href={`/cars/${booking.car.id}`}
                    className="font-medium hover:text-accent"
                  >
                    {booking.car.make} {booking.car.model}
                  </Link>
                  <p className="text-sm text-muted-foreground">{booking.car.year}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Pickup</p>
                  <p className="mt-0.5 font-mono tabular-nums">{booking.startDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Return</p>
                  <p className="mt-0.5 font-mono tabular-nums">{booking.endDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="mt-0.5 font-mono tabular-nums">
                    {days} day{days > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="mt-0.5 font-mono tabular-nums font-semibold">
                    ${booking.totalPrice}
                  </p>
                </div>
              </div>

              {booking.status === "pending" && isOwner && (
                <div className="border-t border-border pt-4">
                  <Button
                    variant="outline"
                    disabled={cancelBooking.isPending}
                    onClick={() => cancelBooking.mutate({ id: booking.id })}
                  >
                    {cancelBooking.isPending ? "Cancelling..." : "Cancel request"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingTimeline events={booking.events} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
