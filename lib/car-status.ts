export type CarDisplayStatus = "available" | "rented" | "maintenance";

// The stored car status only tracks an admin-controlled maintenance flag.
// "Rented" is never stored -- it's derived from whether an approved booking
// currently covers today, so it can never drift out of sync with bookings.
export function computeCarDisplayStatus(
  rawStatus: string,
  isCurrentlyBooked: boolean,
): CarDisplayStatus {
  if (rawStatus === "maintenance" || rawStatus === "unavailable") return "maintenance";
  if (isCurrentlyBooked) return "rented";
  return "available";
}
