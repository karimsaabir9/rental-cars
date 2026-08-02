import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { user } from "@/db/schema/auth";
import { bookings, bookingStatusEnum } from "@/db/schema/bookings";

// One row per status transition, powering the booking status timeline.
export const bookingEvents = pgTable("booking_events", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull(),
  actorId: text("actor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
