import { relations } from "drizzle-orm";
import { user } from "@/db/schema/auth";
import { cars } from "@/db/schema/cars";
import { bookings } from "@/db/schema/bookings";
import { bookingEvents } from "@/db/schema/booking-events";
import { payments } from "@/db/schema/payments";

export const userRelations = relations(user, ({ many }) => ({
  bookings: many(bookings),
  bookingEvents: many(bookingEvents),
  payments: many(payments),
}));

export const carsRelations = relations(cars, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(user, { fields: [bookings.userId], references: [user.id] }),
  car: one(cars, { fields: [bookings.carId], references: [cars.id] }),
  events: many(bookingEvents),
  payment: one(payments, { fields: [bookings.id], references: [payments.bookingId] }),
}));

export const bookingEventsRelations = relations(bookingEvents, ({ one }) => ({
  booking: one(bookings, { fields: [bookingEvents.bookingId], references: [bookings.id] }),
  actor: one(user, { fields: [bookingEvents.actorId], references: [user.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  user: one(user, { fields: [payments.userId], references: [user.id] }),
}));
