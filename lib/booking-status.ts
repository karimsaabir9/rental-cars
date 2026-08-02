export const BOOKING_STATUS_LABEL = {
  confirmed: "Approved",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const BOOKING_STATUS_VARIANT = {
  confirmed: "success",
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  completed: "secondary",
  cancelled: "outline",
} as const;

export const BOOKING_STATUS_ORDER = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
] as const;
