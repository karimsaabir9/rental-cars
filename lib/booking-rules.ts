// Pure booking business rules, kept separate from trpc/routers/bookings.ts
// so the logic most prone to costly bugs (double-booked cars, wrong prices,
// invalid status transitions) can be unit tested without a database.

export type BookingStatus = "confirmed" | "pending" | "approved" | "rejected" | "completed" | "cancelled";

// "confirmed" is the legacy instant-book status; treated as active here so
// any pre-workflow rows still correctly block overlapping dates.
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = ["confirmed", "pending", "approved"];

export type DateRange = { startDate: string; endDate: string };

export type DateRangeValidation = { valid: true } | { valid: false; reason: string };

export function isValidBookingRange(range: DateRange, today: string): DateRangeValidation {
  if (range.endDate < range.startDate) {
    return { valid: false, reason: "End date must be after start date." };
  }
  if (range.startDate < today) {
    return { valid: false, reason: "Start date can't be in the past." };
  }
  return { valid: true };
}

// ISO date strings (YYYY-MM-DD) compare correctly with <= / >=, so this
// mirrors the lte/gte overlap condition used at the SQL layer.
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && a.endDate >= b.startDate;
}

export function findOverlappingBooking<T extends DateRange & { id: string; status: BookingStatus }>(
  candidate: DateRange,
  existingBookings: readonly T[],
  excludeBookingId?: string,
): T | undefined {
  return existingBookings.find(
    (booking) =>
      booking.id !== excludeBookingId &&
      ACTIVE_BOOKING_STATUSES.includes(booking.status) &&
      rangesOverlap(candidate, booking),
  );
}

// Inclusive of both start and end day (a 1-day rental has startDate === endDate).
export function computeTotalPrice(pricePerDay: number, range: DateRange): string {
  const days =
    (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1;
  return (pricePerDay * days).toFixed(2);
}

export function canCancelBooking(status: BookingStatus): boolean {
  return status === "pending";
}

export function canApproveBooking(status: BookingStatus): boolean {
  return status === "pending";
}

export function canRejectBooking(status: BookingStatus): boolean {
  return status === "pending";
}

export function canCompleteBooking(status: BookingStatus): boolean {
  return status === "approved";
}
