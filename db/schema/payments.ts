import { pgTable, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { user } from "@/db/schema/auth";
import { bookings } from "@/db/schema/bookings";

export const paymentMethodEnum = pgEnum("payment_method", ["card", "cash"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

// One payment per booking, created (as "pending") when a booking is
// approved. "method" is chosen later, at checkout.
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  bookingId: text("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  transactionRef: text("transaction_ref"),
  // Client-generated key for the in-flight charge attempt. Lets pay() tell
  // a genuine retry of the same attempt (return the stored outcome, no
  // second charge) apart from a new attempt after a failure (process it
  // normally) -- see the row lock + key check in payments.pay.
  idempotencyKey: text("idempotency_key"),
  // Set once a Stripe Checkout Session is created for a card attempt; the
  // webhook handler looks the payment up by this (via session metadata) to
  // confirm it, so it doesn't need to trust anything the client says.
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
