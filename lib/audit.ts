import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

// Best-effort, like notify()/sendEmail() -- a logging failure should never
// roll back or block the real admin action (refund, status change, etc.)
// that triggered it.
export async function logAudit({
  entityType,
  entityId,
  action,
  actorId,
  metadata,
}: {
  entityType: "payment" | "car";
  entityId: string;
  action: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLog).values({ entityType, entityId, action, actorId, metadata });
  } catch (err) {
    console.error("[audit] failed to write audit log entry", err);
  }
}
