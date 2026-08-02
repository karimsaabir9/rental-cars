"use client";

import Link from "next/link";
import { toast } from "sonner";
import { CalendarX } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT } from "@/lib/booking-status";

export function MyBookingsTable() {
  const { data: bookings, isLoading } = trpc.bookings.listMine.useQuery();
  const utils = trpc.useUtils();

  const cancelBooking = trpc.bookings.cancelMine.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled.");
      utils.bookings.listMine.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <CalendarX className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">You haven&apos;t made any bookings yet.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Car</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              <Link href={`/dashboard/bookings/${booking.id}`} className="hover:text-accent">
                {booking.car.make} {booking.car.model}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-sm tabular-nums">
              {booking.startDate} &rarr; {booking.endDate}
            </TableCell>
            <TableCell className="font-mono tabular-nums">${booking.totalPrice}</TableCell>
            <TableCell>
              <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                {BOOKING_STATUS_LABEL[booking.status]}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              {booking.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelBooking.isPending}
                  onClick={() => cancelBooking.mutate({ id: booking.id })}
                >
                  Cancel
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/bookings/${booking.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
