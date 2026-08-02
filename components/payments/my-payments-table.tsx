"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
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
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_VARIANT } from "@/lib/payment-status";

export function MyPaymentsTable() {
  const { data: payments, isLoading } = trpc.payments.listMine.useQuery();

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <Receipt className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">No payments yet.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Car</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              <Link
                href={`/dashboard/bookings/${payment.bookingId}`}
                className="hover:text-accent"
              >
                {payment.booking.car.make} {payment.booking.car.model}
              </Link>
              <div className="font-mono text-xs tabular-nums text-muted-foreground">
                {payment.booking.startDate} &rarr; {payment.booking.endDate}
              </div>
            </TableCell>
            <TableCell className="font-mono tabular-nums">${payment.amount}</TableCell>
            <TableCell>{payment.method ? PAYMENT_METHOD_LABEL[payment.method] : "—"}</TableCell>
            <TableCell>
              <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>
                {PAYMENT_STATUS_LABEL[payment.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="ghost" size="sm">
                <a href={`/api/invoices/${payment.bookingId}`} download>
                  Download
                </a>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
