"use client";

import { toast } from "sonner";
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

const statusVariant = {
  confirmed: "success",
  completed: "secondary",
  cancelled: "destructive",
} as const;

export function AdminBookingsTable() {
  const { data: bookings, isLoading } = trpc.bookings.listAll.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking updated.");
      utils.bookings.listAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No bookings yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
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
              {booking.user.name}
              <div className="text-xs text-muted-foreground">{booking.user.email}</div>
            </TableCell>
            <TableCell>
              {booking.car.make} {booking.car.model}
            </TableCell>
            <TableCell className="font-mono text-sm tabular-nums">
              {booking.startDate} &rarr; {booking.endDate}
            </TableCell>
            <TableCell className="font-mono tabular-nums">${booking.totalPrice}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[booking.status]}>{booking.status}</Badge>
            </TableCell>
            <TableCell className="space-x-2">
              {booking.status === "confirmed" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: booking.id, status: "completed" })}
                  >
                    Mark completed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: booking.id, status: "cancelled" })}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
