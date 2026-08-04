import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { notify } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { canMarkCashPaid, canPay, canRefund, decideCardOutcome, mockTransactionRef } from "@/lib/payment-rules";

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

  // See bookings.listAll for why this is capped rather than paginated at
  // the query layer.
  listAll: adminProcedure.query(async () => {
    return db.query.payments.findMany({
      with: { booking: { with: { car: true } }, user: true },
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit: 500,
    });
  }),

  pay: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        method: z.enum(["card", "cash"]),
        // Client generates one key per payment attempt (reused across
        // retries of that same attempt, not regenerated per click) so a
        // duplicate request -- a double-click, or a client-side retry after
        // a dropped response -- can be told apart from a genuine new
        // attempt. See the transaction below.
        idempotencyKey: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit("paymentAttempt", ctx.session.user.id);

      const payment = await db.query.payments.findFirst({
        where: eq(payments.bookingId, input.bookingId),
        with: { booking: { with: { car: true } } },
      });
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      if (payment.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // The row lock serializes concurrent pay() calls on this payment --
      // without it, two requests that race before either write lands could
      // both pass the canPay check and both "charge" (with a real gateway,
      // that's an actual double charge, not just a data race). Re-reading
      // status from the locked row (not the read above) is what makes that
      // safe; a matching idempotencyKey on an already-settled row means
      // this is a replay of a request already processed, so it returns the
      // stored outcome instead of erroring or charging again.
      const { updated, chargedNow } = await db.transaction(async (tx) => {
        const [locked] = await tx.select().from(payments).where(eq(payments.id, payment.id)).for("update");

        const isReplay =
          !!input.idempotencyKey && locked.idempotencyKey === input.idempotencyKey && !canPay(locked.status);
        if (isReplay) return { updated: locked, chargedNow: false };

        if (!canPay(locked.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This booking is already paid." });
        }

        if (input.method === "cash") {
          const [row] = await tx
            .update(payments)
            .set({ method: "cash", idempotencyKey: input.idempotencyKey ?? null })
            .where(eq(payments.id, payment.id))
            .returning();
          return { updated: row, chargedNow: false };
        }

        const succeeded = decideCardOutcome(Math.random());
        const [row] = await tx
          .update(payments)
          .set({
            method: "card",
            status: succeeded ? "paid" : "failed",
            paidAt: succeeded ? new Date() : null,
            transactionRef: succeeded ? mockTransactionRef("TXN") : null,
            idempotencyKey: input.idempotencyKey ?? null,
          })
          .where(eq(payments.id, payment.id))
          .returning();
        return { updated: row, chargedNow: true };
      });

      if (chargedNow && updated.method === "card") {
        const carLabel = `${payment.booking.car.make} ${payment.booking.car.model}`;
        await notify(
          updated.status === "paid"
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
      }

      return updated;
    }),

  markCashPaid: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, input.id),
        with: { booking: { with: { car: true } }, user: true },
      });
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canMarkCashPaid(payment.method, payment.status)) {
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

      await logAudit({
        entityType: "payment",
        entityId: payment.id,
        action: "marked_cash_paid",
        actorId: ctx.session.user.id,
        metadata: { amount: payment.amount, bookingId: payment.bookingId },
      });

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

  refund: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const payment = await db.query.payments.findFirst({ where: eq(payments.id, input.id) });
    if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
    if (!canRefund(payment.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only paid payments can be refunded." });
    }
    const [updated] = await db
      .update(payments)
      .set({ status: "refunded", refundedAt: new Date() })
      .where(eq(payments.id, input.id))
      .returning();

    await logAudit({
      entityType: "payment",
      entityId: payment.id,
      action: "refunded",
      actorId: ctx.session.user.id,
      metadata: { amount: payment.amount, bookingId: payment.bookingId },
    });

    return updated;
  }),
});
