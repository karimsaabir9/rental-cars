import { describe, expect, it } from "vitest";
import {
  CARD_SUCCESS_RATE,
  canMarkCashPaid,
  canPay,
  canRefund,
  decideCardOutcome,
  mockTransactionRef,
} from "./payment-rules";

describe("canPay", () => {
  it("allows paying a pending payment", () => {
    expect(canPay("pending")).toBe(true);
  });

  it("allows retrying a failed payment", () => {
    expect(canPay("failed")).toBe(true);
  });

  it("blocks paying an already-paid payment", () => {
    expect(canPay("paid")).toBe(false);
  });

  it("blocks paying a refunded payment", () => {
    expect(canPay("refunded")).toBe(false);
  });
});

describe("canMarkCashPaid", () => {
  it("allows confirming a pending cash payment", () => {
    expect(canMarkCashPaid("cash", "pending")).toBe(true);
  });

  it("blocks a card payment", () => {
    expect(canMarkCashPaid("card", "pending")).toBe(false);
  });

  it("blocks a cash payment with no method chosen yet", () => {
    expect(canMarkCashPaid(null, "pending")).toBe(false);
  });

  it("blocks a cash payment that's already paid", () => {
    expect(canMarkCashPaid("cash", "paid")).toBe(false);
  });
});

describe("canRefund", () => {
  it("allows refunding a paid payment", () => {
    expect(canRefund("paid")).toBe(true);
  });

  it("blocks refunding a pending payment", () => {
    expect(canRefund("pending")).toBe(false);
  });

  it("blocks double-refunding", () => {
    expect(canRefund("refunded")).toBe(false);
  });
});

describe("decideCardOutcome", () => {
  it("succeeds for rolls below the success rate", () => {
    expect(decideCardOutcome(0)).toBe(true);
    expect(decideCardOutcome(CARD_SUCCESS_RATE - 0.01)).toBe(true);
  });

  it("fails for rolls at or above the success rate", () => {
    expect(decideCardOutcome(CARD_SUCCESS_RATE)).toBe(false);
    expect(decideCardOutcome(0.99)).toBe(false);
  });

  it("respects a custom success rate", () => {
    expect(decideCardOutcome(0.5, 1)).toBe(true);
    expect(decideCardOutcome(0.5, 0)).toBe(false);
  });
});

describe("mockTransactionRef", () => {
  it("prefixes the reference and uppercases the random suffix", () => {
    expect(mockTransactionRef("TXN", () => 0.123456789)).toBe("TXN-4FZZZXJY");
  });

  it("uses a different prefix for cash confirmations", () => {
    const ref = mockTransactionRef("CASH", () => 0.5);
    expect(ref.startsWith("CASH-")).toBe(true);
  });
});
