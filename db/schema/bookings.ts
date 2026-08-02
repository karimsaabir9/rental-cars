import { pgTable, text, numeric, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { user } from "@/db/schema/auth";
import { cars } from "@/db/schema/cars";

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
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
  status: bookingStatusEnum("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
