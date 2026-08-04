const ACTION_LABEL: Record<string, string> = {
  refunded: "Refunded",
  marked_cash_paid: "Marked cash paid",
  status_changed: "Status changed",
  deleted: "Deleted",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABEL[action] ?? action;
}

export function auditEntityLabel(entityType: string): string {
  return entityType === "payment" ? "Payment" : entityType === "car" ? "Car" : entityType;
}

export function auditDetails(action: string, metadata: unknown): string {
  const m = (metadata ?? {}) as Record<string, unknown>;
  switch (action) {
    case "refunded":
    case "marked_cash_paid":
      return `$${m.amount ?? "?"}`;
    case "status_changed":
      return `${m.from ?? "?"} → ${m.to ?? "?"}`;
    case "deleted":
      return [m.make, m.model].filter(Boolean).join(" ") || "—";
    default:
      return "—";
  }
}
