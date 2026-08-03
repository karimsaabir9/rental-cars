import { describe, expect, it } from "vitest";
import {
  canApproveBooking,
  canCancelBooking,
  canCompleteBooking,
  canRejectBooking,
  computeTotalPrice,
  findOverlappingBooking,
  isValidBookingRange,
  rangesOverlap,
  type BookingStatus,
} from "./booking-rules";

describe("isValidBookingRange", () => {
  const today = "2026-06-10";

  it("accepts a range starting today", () => {
    expect(isValidBookingRange({ startDate: today, endDate: "2026-06-12" }, today)).toEqual({
      valid: true,
    });
  });

  it("accepts a same-day (1-day) range", () => {
    expect(isValidBookingRange({ startDate: today, endDate: today }, today)).toEqual({
      valid: true,
    });
  });

  it("rejects an end date before the start date", () => {
    const result = isValidBookingRange({ startDate: "2026-06-12", endDate: "2026-06-10" }, today);
    expect(result).toEqual({ valid: false, reason: "End date must be after start date." });
  });

  it("rejects a start date in the past", () => {
    const result = isValidBookingRange({ startDate: "2026-06-09", endDate: "2026-06-12" }, today);
    expect(result).toEqual({ valid: false, reason: "Start date can't be in the past." });
  });
});

describe("rangesOverlap", () => {
  it("detects a partial overlap on the start side", () => {
    expect(
      rangesOverlap({ startDate: "2026-06-05", endDate: "2026-06-10" }, { startDate: "2026-06-08", endDate: "2026-06-15" }),
    ).toBe(true);
  });

  it("detects a partial overlap on the end side", () => {
    expect(
      rangesOverlap({ startDate: "2026-06-08", endDate: "2026-06-15" }, { startDate: "2026-06-05", endDate: "2026-06-10" }),
    ).toBe(true);
  });

  it("detects one range fully containing another", () => {
    expect(
      rangesOverlap({ startDate: "2026-06-01", endDate: "2026-06-20" }, { startDate: "2026-06-05", endDate: "2026-06-10" }),
    ).toBe(true);
  });

  it("detects an exact match", () => {
    expect(
      rangesOverlap({ startDate: "2026-06-05", endDate: "2026-06-10" }, { startDate: "2026-06-05", endDate: "2026-06-10" }),
    ).toBe(true);
  });

  it("treats back-to-back ranges sharing a boundary day as overlapping", () => {
    // The existing booking ends the same day the new one starts -- the car
    // can't be handed over and returned twice in one day, so this counts
    // as a conflict rather than a valid same-day turnaround.
    expect(
      rangesOverlap({ startDate: "2026-06-10", endDate: "2026-06-15" }, { startDate: "2026-06-05", endDate: "2026-06-10" }),
    ).toBe(true);
  });

  it("does not flag genuinely non-overlapping ranges", () => {
    expect(
      rangesOverlap({ startDate: "2026-06-11", endDate: "2026-06-15" }, { startDate: "2026-06-05", endDate: "2026-06-10" }),
    ).toBe(false);
  });
});

describe("findOverlappingBooking", () => {
  type Row = { id: string; startDate: string; endDate: string; status: BookingStatus };

  const existing: Row[] = [
    { id: "b1", startDate: "2026-06-01", endDate: "2026-06-05", status: "approved" },
    { id: "b2", startDate: "2026-06-10", endDate: "2026-06-15", status: "pending" },
    { id: "b3", startDate: "2026-06-20", endDate: "2026-06-25", status: "cancelled" },
    { id: "b4", startDate: "2026-06-20", endDate: "2026-06-25", status: "rejected" },
  ];

  it("finds a conflict against an approved booking", () => {
    const conflict = findOverlappingBooking({ startDate: "2026-06-03", endDate: "2026-06-04" }, existing);
    expect(conflict?.id).toBe("b1");
  });

  it("finds a conflict against a pending (not-yet-approved) booking", () => {
    const conflict = findOverlappingBooking({ startDate: "2026-06-12", endDate: "2026-06-13" }, existing);
    expect(conflict?.id).toBe("b2");
  });

  it("ignores cancelled and rejected bookings even if dates overlap", () => {
    const conflict = findOverlappingBooking({ startDate: "2026-06-22", endDate: "2026-06-23" }, existing);
    expect(conflict).toBeUndefined();
  });

  it("returns undefined when no dates overlap", () => {
    const conflict = findOverlappingBooking({ startDate: "2026-07-01", endDate: "2026-07-05" }, existing);
    expect(conflict).toBeUndefined();
  });

  it("excludes the booking being edited from its own conflict check", () => {
    const conflict = findOverlappingBooking(
      { startDate: "2026-06-10", endDate: "2026-06-15" },
      existing,
      "b2",
    );
    expect(conflict).toBeUndefined();
  });
});

describe("computeTotalPrice", () => {
  it("charges for a single day when start equals end", () => {
    expect(computeTotalPrice(50, { startDate: "2026-06-10", endDate: "2026-06-10" })).toBe("50.00");
  });

  it("charges inclusively across multiple days", () => {
    // June 10 through June 12 is 3 days, not 2.
    expect(computeTotalPrice(50, { startDate: "2026-06-10", endDate: "2026-06-12" })).toBe("150.00");
  });

  it("rounds to two decimal places", () => {
    expect(computeTotalPrice(33.33, { startDate: "2026-06-10", endDate: "2026-06-11" })).toBe("66.66");
  });
});

describe("booking status transition guards", () => {
  it("allows cancel only from pending", () => {
    expect(canCancelBooking("pending")).toBe(true);
    for (const status of ["approved", "rejected", "completed", "cancelled", "confirmed"] as const) {
      expect(canCancelBooking(status)).toBe(false);
    }
  });

  it("allows approve only from pending", () => {
    expect(canApproveBooking("pending")).toBe(true);
    expect(canApproveBooking("approved")).toBe(false);
  });

  it("allows reject only from pending", () => {
    expect(canRejectBooking("pending")).toBe(true);
    expect(canRejectBooking("approved")).toBe(false);
  });

  it("allows complete only from approved", () => {
    expect(canCompleteBooking("approved")).toBe(true);
    expect(canCompleteBooking("pending")).toBe(false);
  });
});
