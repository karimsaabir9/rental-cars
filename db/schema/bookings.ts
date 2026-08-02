import { pgTable, text, numeric, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { user } from "@/db/schema/auth";
import { cars } from "@/db/schema/cars";

// "confirmed" is legacy (pre-approval-workflow instant-book status) and is no
// longer written by the app, but stays in the enum so existing rows and the
// Postgres type itself don't need a destructive migration.
export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
]);

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  carId: text("car_id")
    .notNull()
    .references(() => cars.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
