// Pure payment business rules, kept separate from trpc/routers/payments.ts
// so status-transition guards can be unit tested without a database. Card
// outcomes are decided by Stripe now (see the webhook handler), not
// simulated here.

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "card" | "cash" | null;

export function canPay(status: PaymentStatus): boolean {
  return status !== "paid" && status !== "refunded";
}

export function canMarkCashPaid(method: PaymentMethod, status: PaymentStatus): boolean {
  return method === "cash" && status === "pending";
}

export function canRefund(status: PaymentStatus): boolean {
  return status === "paid";
}

// Cash confirmations still need a reference, since there's no gateway
// transaction id to fall back on.
export function mockTransactionRef(prefix: string, random: () => number = Math.random): string {
  return `${prefix}-${random().toString(36).slice(2, 10).toUpperCase()}`;
}
