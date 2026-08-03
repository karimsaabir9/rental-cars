// Pure payment business rules, kept separate from trpc/routers/payments.ts
// so status-transition guards and the simulated card outcome can be unit
// tested without a database or Math.random().

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "card" | "cash" | null;

// No real gateway is wired up, so this stands in for a charge attempt. A
// small failure rate keeps "failed" meaningfully reachable (and retryable)
// rather than purely theoretical.
export const CARD_SUCCESS_RATE = 0.88;

export function canPay(status: PaymentStatus): boolean {
  return status !== "paid" && status !== "refunded";
}

export function canMarkCashPaid(method: PaymentMethod, status: PaymentStatus): boolean {
  return method === "cash" && status === "pending";
}

export function canRefund(status: PaymentStatus): boolean {
  return status === "paid";
}

// `roll` is a [0, 1) value, normally Math.random() -- injected here so the
// success-rate threshold is directly testable.
export function decideCardOutcome(roll: number, successRate: number = CARD_SUCCESS_RATE): boolean {
  return roll < successRate;
}

export function mockTransactionRef(prefix: string, random: () => number = Math.random): string {
  return `${prefix}-${random().toString(36).slice(2, 10).toUpperCase()}`;
}
