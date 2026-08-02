export const PAYMENT_STATUS_LABEL = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
} as const;

export const PAYMENT_STATUS_VARIANT = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "secondary",
} as const;

export const PAYMENT_METHOD_LABEL = {
  card: "Card",
  cash: "Cash on pickup",
} as const;
