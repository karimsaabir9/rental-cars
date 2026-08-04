"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Download, Wallet } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_VARIANT } from "@/lib/payment-status";

export function PaymentPanel({
  bookingId,
  isOwner,
}: {
  bookingId: string;
  isOwner: boolean;
}) {
  const utils = trpc.useUtils();
  const { data: payment, isLoading } = trpc.payments.getByBooking.useQuery({ bookingId });
  const [pendingMethod, setPendingMethod] = useState<"card" | "cash" | null>(null);
  // Doubles as an in-flight guard and the current attempt's idempotency
  // key: non-null while a request is out, so a double-click firing two
  // click events before React re-renders (isPending is state, so it
  // wouldn't catch this in time) still only sends one request.
  const attemptKeyRef = useRef<string | null>(null);

  // Returning from Stripe Checkout. The webhook (not this redirect) is the
  // source of truth for whether the charge actually succeeded, so this
  // just nudges a refetch rather than trusting success_url on its own --
  // the webhook is usually faster than the redirect but isn't guaranteed
  // to be, so the badge may briefly still say "pending" here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("payment");
    if (!outcome) return;
    if (outcome === "success") {
      toast.success("Payment received -- confirming...");
      utils.payments.getByBooking.invalidate({ bookingId });
    } else if (outcome === "cancelled") {
      toast.info("Checkout cancelled. No charge was made.");
    }
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = trpc.payments.pay.useMutation({
    onSuccess: () => {
      utils.payments.getByBooking.invalidate({ bookingId });
      toast.success("Cash on pickup selected. Pay when you collect the car.");
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => {
      attemptKeyRef.current = null;
      setPendingMethod(null);
    },
  });

  const checkout = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Full-page navigation to Stripe, not a client-side route -- the
      // component unmounts here, so there's no "settled" state to reset.
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
      attemptKeyRef.current = null;
      setPendingMethod(null);
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!payment) return null;

  function handlePay(method: "card" | "cash") {
    if (attemptKeyRef.current) return;
    const idempotencyKey = crypto.randomUUID();
    attemptKeyRef.current = idempotencyKey;
    setPendingMethod(method);

    if (method === "card") {
      checkout.mutate({ bookingId, idempotencyKey });
      return;
    }
    pay.mutate({ bookingId, idempotencyKey });
  }

  const isPending = pay.isPending || checkout.isPending;
  const showMethodPicker = isOwner && (payment.status === "pending" || payment.status === "failed");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Payment</CardTitle>
        <Badge variant={PAYMENT_STATUS_VARIANT[payment.status]}>
          {PAYMENT_STATUS_LABEL[payment.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Amount due</span>
          <span className="font-mono text-lg font-semibold tabular-nums">${payment.amount}</span>
        </div>

        {payment.method && (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span>{PAYMENT_METHOD_LABEL[payment.method]}</span>
          </div>
        )}

        {payment.transactionRef && (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono text-xs">{payment.transactionRef}</span>
          </div>
        )}

        {payment.method === "cash" && payment.status === "pending" && (
          <p className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
            Pay in cash when you pick up the car.
          </p>
        )}

        {showMethodPicker && (
          <div className="space-y-2 border-t border-border pt-4">
            {payment.status === "failed" && (
              <p className="text-sm text-destructive">
                Your last payment attempt failed. Try again below.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                disabled={isPending}
                onClick={() => handlePay("card")}
              >
                <CreditCard className="size-4" />
                {pendingMethod === "card" && isPending ? "Redirecting..." : "Pay with card"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={() => handlePay("cash")}
              >
                <Wallet className="size-4" />
                {pendingMethod === "cash" && isPending ? "Saving..." : "Pay on pickup"}
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/invoices/${bookingId}`} download>
              <Download className="size-4" />
              Download {payment.status === "paid" || payment.status === "refunded" ? "receipt" : "invoice"}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
