"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT } from "@/lib/booking-status";
import { toCsv, downloadCsv } from "@/lib/csv";
import { matchesQuery } from "@/lib/search";
import type { RouterOutputs } from "@/trpc/routers/_app";

function bookingMatches(booking: RouterOutputs["bookings"]["listAll"][number], query: string) {
  return matchesQuery(
    [booking.user.name, booking.user.email, booking.car.make, booking.car.model],
    query,
  );
}

function exportBookingsCsv(bookings: RouterOutputs["bookings"]["listAll"]) {
  const csv = toCsv(bookings, [
    { label: "Customer", value: (b) => b.user.name },
    { label: "Email", value: (b) => b.user.email },
    { label: "Car", value: (b) => `${b.car.make} ${b.car.model}` },
    { label: "Start date", value: (b) => b.startDate },
    { label: "End date", value: (b) => b.endDate },
    { label: "Total price", value: (b) => b.totalPrice },
    { label: "Status", value: (b) => b.status },
    { label: "Created at", value: (b) => b.createdAt.toISOString() },
  ]);
  downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function AdminBookingsTable() {
  const { data: bookings, isLoading } = trpc.bookings.listAll.useQuery();
  const utils = trpc.useUtils();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");

  const invalidate = () => utils.bookings.listAll.invalidate();

  const approve = trpc.bookings.approve.useMutation({
    onSuccess: () => {
      toast.success("Booking approved.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const reject = trpc.bookings.reject.useMutation({
    onSuccess: () => {
      toast.success("Booking rejected.");
      invalidate();
      setRejectingId(null);
      setReason("");
    },
    onError: (error) => toast.error(error.message),
  });

  const complete = trpc.bookings.complete.useMutation({
    onSuccess: () => {
      toast.success("Booking marked completed.");
      invalidate();
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

  const isPending = approve.isPending || reject.isPending || complete.isPending;
  const filtered = bookings.filter((b) => bookingMatches(b, query));

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            className="w-64 pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer or car"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportBookingsCsv(bookings)}>
          <Download />
          Export CSV
        </Button>
      </div>
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
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No bookings match your search.
              </TableCell>
            </TableRow>
          )}
          {filtered.map((booking) => (
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
                <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                  {BOOKING_STATUS_LABEL[booking.status]}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                {booking.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => approve.mutate({ id: booking.id })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setRejectingId(booking.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {booking.status === "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => complete.mutate({ id: booking.id })}
                  >
                    Mark completed
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!rejectingId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject booking</DialogTitle>
            <DialogDescription>
              Let the customer know why this request was rejected (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Car needed for maintenance during these dates"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() =>
                rejectingId &&
                reject.mutate({ id: rejectingId, reason: reason.trim() || undefined })
              }
            >
              {reject.isPending ? "Rejecting..." : "Reject booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
