import { describe, expect, it } from "vitest";
import { auditActionLabel, auditDetails, auditEntityLabel } from "./audit-log-format";

describe("auditActionLabel", () => {
  it("maps known actions to readable labels", () => {
    expect(auditActionLabel("refunded")).toBe("Refunded");
    expect(auditActionLabel("marked_cash_paid")).toBe("Marked cash paid");
  });

  it("falls back to the raw action for unknown values", () => {
    expect(auditActionLabel("something_new")).toBe("something_new");
  });
});

describe("auditEntityLabel", () => {
  it("maps known entity types", () => {
    expect(auditEntityLabel("payment")).toBe("Payment");
    expect(auditEntityLabel("car")).toBe("Car");
  });
});

describe("auditDetails", () => {
  it("formats a refund/cash-paid amount", () => {
    expect(auditDetails("refunded", { amount: "55.00" })).toBe("$55.00");
    expect(auditDetails("marked_cash_paid", { amount: "90.00" })).toBe("$90.00");
  });

  it("formats a status change as a transition", () => {
    expect(auditDetails("status_changed", { from: "available", to: "maintenance" })).toBe(
      "available → maintenance",
    );
  });

  it("formats a deletion as the car's make/model", () => {
    expect(auditDetails("deleted", { make: "Toyota", model: "Corolla" })).toBe("Toyota Corolla");
  });

  it("falls back to an em dash for missing or unrecognized metadata", () => {
    expect(auditDetails("deleted", {})).toBe("—");
    expect(auditDetails("unknown_action", { foo: "bar" })).toBe("—");
  });
});
