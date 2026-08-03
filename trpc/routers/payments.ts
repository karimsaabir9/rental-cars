import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { notify } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/rate-limit";

// Simulated card processing -- no real gateway is wired up, so this stands
// in for a charge attempt. A small failure rate keeps the "failed" status
// meaningfully reachable (and retryable) rather than purely theoretical.
const CARD_SUCCESS_RATE = 0.88;

function mockTransactionRef(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export const paymentsRouter = createTRPCRouter({
  getByBooking: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.bookingId, input.bookingId),
      });
      if (!payment) return null;
      if (payment.userId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return payment;
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return db.query.payments.findMany({
      where: eq(payments.userId, ctx.session.user.id),
      with: { booking: { with: { car: true } } },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  }),

  listAll: adminProcedure.query(async () => {
    return db.query.payments.findMany({
      with: { booking: { with: { car: true } }, user: true },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  }),

  pay: protectedProcedure
    .input(z.object({ bookingId: z.string(), method: z.enum(["card", "cash"]) }))
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit("paymentAttempt", ctx.session.user.id);

      const payment = await db.query.payments.findFirst({
        where: eq(payments.bookingId, input.bookingId),
        with: { booking: { with: { car: true } } },
      });
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      if (payment.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (payment.status === "paid" || payment.status === "refunded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This booking is already paid." });
      }

      if (input.method === "cash") {
        const [updated] = await db
          .update(payments)
          .set({ method: "cash" })
          .where(eq(payments.id, payment.id))
          .returning();
        return updated;
      }

      const succeeded = Math.random() < CARD_SUCCESS_RATE;
      const [updated] = await db
        .update(payments)
        .set({
          method: "card",
          status: succeeded ? "paid" : "failed",
          paidAt: succeeded ? new Date() : null,
          transactionRef: succeeded ? mockTransactionRef("TXN") : null,
        })
        .where(eq(payments.id, payment.id))
        .returning();

      const carLabel = `${payment.booking.car.make} ${payment.booking.car.model}`;
      await notify(
        succeeded
          ? {
              userId: ctx.session.user.id,
              email: ctx.session.user.email,
              type: "payment_paid",
              title: "Payment received",
              message: `We've received your payment of $${payment.amount} for ${carLabel}.`,
              link: `/dashboard/bookings/${payment.bookingId}`,
              ctaLabel: "View receipt",
            }
          : {
              userId: ctx.session.user.id,
              email: ctx.session.user.email,
              type: "payment_failed",
              title: "Payment failed",
              message: `Your card payment of $${payment.amount} for ${carLabel} didn't go through. Please try again.`,
              link: `/dashboard/bookings/${payment.bookingId}`,
              ctaLabel: "Retry payment",
            },
      );

      return updated;
    }),

  markCashPaid: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, input.id),
        with: { booking: { with: { car: true } }, user: true },
      });
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      if (payment.method !== "cash" || payment.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending cash payments can be confirmed.",
        });
      }
      const [updated] = await db
        .update(payments)
        .set({ status: "paid", paidAt: new Date(), transactionRef: mockTransactionRef("CASH") })
        .where(eq(payments.id, input.id))
        .returning();

      await notify({
        userId: payment.userId,
        email: payment.user.email,
        type: "payment_paid",
        title: "Payment received",
        message: `Your cash payment of $${payment.amount} for ${payment.booking.car.make} ${payment.booking.car.model} has been confirmed.`,
        link: `/dashboard/bookings/${payment.bookingId}`,
        ctaLabel: "View receipt",
      });

      return updated;
    }),

  refund: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const payment = await db.query.payments.findFirst({ where: eq(payments.id, input.id) });
    if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
    if (payment.status !== "paid") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only paid payments can be refunded." });
    }
    const [updated] = await db
      .update(payments)
      .set({ status: "refunded", refundedAt: new Date() })
      .where(eq(payments.id, input.id))
      .returning();
    return updated;
  }),
});
