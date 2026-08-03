"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Download } from "lucide-react";
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
import { toCsv, downloadCsv } from "@/lib/csv";
import type { RouterOutputs } from "@/trpc/routers/_app";

function exportPaymentsCsv(payments: RouterOutputs["payments"]["listAll"]) {
  const csv = toCsv(payments, [
    { label: "Customer", value: (p) => p.user.name },
    { label: "Email", value: (p) => p.user.email },
    { label: "Car", value: (p) => `${p.booking.car.make} ${p.booking.car.model}` },
    { label: "Amount", value: (p) => p.amount },
    { label: "Method", value: (p) => p.method ?? "" },
    { label: "Status", value: (p) => p.status },
    { label: "Transaction ref", value: (p) => p.transactionRef ?? "" },
    { label: "Paid at", value: (p) => (p.paidAt ? p.paidAt.toISOString() : "") },
    { label: "Created at", value: (p) => p.createdAt.toISOString() },
  ]);
  downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function AdminPaymentsTable() {
  const { data: payments, isLoading } = trpc.payments.listAll.useQuery();
  const utils = trpc.useUtils();

  const invalidate = () => utils.payments.listAll.invalidate();

  const markCashPaid = trpc.payments.markCashPaid.useMutation({
    onSuccess: () => {
      toast.success("Payment marked as paid.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const refund = trpc.payments.refund.useMutation({
    onSuccess: () => {
      toast.success("Payment refunded.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No payments yet.
      </div>
    );
  }

  const isPending = markCashPaid.isPending || refund.isPending;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportPaymentsCsv(payments)}>
          <Download />
          Export CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
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
                {payment.user.name}
                <div className="text-xs text-muted-foreground">{payment.user.email}</div>
              </TableCell>
              <TableCell>
                {payment.booking.car.make} {payment.booking.car.model}
              </TableCell>
              <TableCell className="font-mono tabular-nums">${payment.amount}</TableCell>
              <TableCell>{payment.method ? PAYMENT_METHOD_LABEL[payment.method] : "—"}</TableCell>
              <TableCell>
                <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>
                  {PAYMENT_STATUS_LABEL[payment.status]}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                {payment.method === "cash" && payment.status === "pending" && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => markCashPaid.mutate({ id: payment.id })}
                  >
                    Mark paid
                  </Button>
                )}
                {payment.status === "paid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => refund.mutate({ id: payment.id })}
                  >
                    Refund
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/bookings/${payment.bookingId}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
