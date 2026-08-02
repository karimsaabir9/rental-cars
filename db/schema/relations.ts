import { relations } from "drizzle-orm";
import { user } from "@/db/schema/auth";
import { cars } from "@/db/schema/cars";
import { bookings } from "@/db/schema/bookings";

export const userRelations = relations(user, ({ many }) => ({
  bookings: many(bookings),
}));

export const carsRelations = relations(cars, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(user, { fields: [bookings.userId], references: [user.id] }),
  car: one(cars, { fields: [bookings.carId], references: [cars.id] }),
}));
