import { describe, expect, it } from "vitest";
import { canMarkCashPaid, canPay, canRefund, mockTransactionRef } from "./payment-rules";

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

describe("mockTransactionRef", () => {
  it("prefixes the reference and uppercases the random suffix", () => {
    expect(mockTransactionRef("TXN", () => 0.123456789)).toBe("TXN-4FZZZXJY");
  });

  it("uses a different prefix for cash confirmations", () => {
    const ref = mockTransactionRef("CASH", () => 0.5);
    expect(ref.startsWith("CASH-")).toBe(true);
  });
});
