import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { user } from "@/db/schema/auth";

// Bookings already get a typed timeline via booking_events; this is the
// equivalent for admin actions that don't have (and don't need) a
// dedicated status-history table of their own -- payment refunds/cash
// confirmations and car status changes. entityId intentionally has no FK
// since it points at whichever table entityType names.
export const auditEntityTypeEnum = pgEnum("audit_entity_type", ["payment", "car"]);

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  entityType: auditEntityTypeEnum("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  actorId: text("actor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
