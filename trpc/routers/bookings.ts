import { z } from "zod";
import { and, eq, lte, gte, ne, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, bookingEvents, cars, payments } from "@/db/schema";
import { notify, notifyAdmins } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/rate-limit";

// "confirmed" is the legacy instant-book status; treated as active here so
// any pre-workflow rows still correctly block overlapping dates.
const ACTIVE_STATUSES = ["confirmed", "pending", "approved"] as const;

const dateRangeInput = z.object({
  carId: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

async function assertNoOverlap(
  carId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string,
) {
  const overlapping = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.carId, carId),
      inArray(bookings.status, ACTIVE_STATUSES),
      lte(bookings.startDate, endDate),
      gte(bookings.endDate, startDate),
      ...(excludeBookingId ? [ne(bookings.id, excludeBookingId)] : []),
    ),
  });
  if (overlapping) {
    throw new TRPCError({ code: "CONFLICT", message: "Car is already booked for these dates." });
  }
}

export const bookingsRouter = createTRPCRouter({
  create: protectedProcedure.input(dateRangeInput).mutation(async ({ ctx, input }) => {
    await enforceRateLimit("bookingCreate", ctx.session.user.id);

    if (input.endDate < input.startDate) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date." });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (input.startDate < today) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Start date can't be in the past." });
    }

    const car = await db.query.cars.findFirst({ where: eq(cars.id, input.carId) });
    if (!car) throw new TRPCError({ code: "NOT_FOUND" });
    if (car.status === "maintenance" || car.status === "unavailable") {
      throw new TRPCError({ code: "CONFLICT", message: "Car is not available for booking." });
    }

    const created = await db.transaction(async (tx) => {
      await assertNoOverlap(input.carId, input.startDate, input.endDate);

      const days =
        (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) /
          (1000 * 60 * 60 * 24) +
        1;
      const totalPrice = (Number(car.pricePerDay) * days).toFixed(2);

      const [created] = await tx
        .insert(bookings)
        .values({
          userId: ctx.session.user.id,
          carId: input.carId,
          startDate: input.startDate,
          endDate: input.endDate,
          totalPrice,
          status: "pending",
        })
        .returning();

      await tx.insert(bookingEvents).values({
        bookingId: created.id,
        status: "pending",
        actorId: ctx.session.user.id,
      });

      return created;
    });

    await notifyAdmins({
      type: "booking_pending",
      title: "New booking request",
      message: `${ctx.session.user.name} requested ${car.make} ${car.model} for ${created.startDate} → ${created.endDate}.`,
      link: `/admin/bookings/${created.id}`,
      ctaLabel: "Review request",
    });

    return created;
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return db.query.bookings.findMany({
      where: eq(bookings.userId, ctx.session.user.id),
      with: { car: true },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, input.id),
      with: {
        car: true,
        user: true,
        events: {
          with: { actor: true },
          orderBy: (e, { asc }) => [asc(e.createdAt)],
        },
      },
    });
    if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
    if (booking.userId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return booking;
  }),

  cancelMine: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, input.id) });
      if (!booking || booking.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (booking.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending bookings can be cancelled.",
        });
      }
      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(bookings)
          .set({ status: "cancelled" })
          .where(eq(bookings.id, input.id))
          .returning();
        await tx.insert(bookingEvents).values({
          bookingId: input.id,
          status: "cancelled",
          actorId: ctx.session.user.id,
        });
        return updated;
      });
    }),

  listAll: adminProcedure.query(async () => {
    return db.query.bookings.findMany({
      with: { car: true, user: true },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }),

  approve: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, input.id),
      with: { car: true, user: true },
    });
    if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
    if (booking.status !== "pending") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending bookings can be approved." });
    }
    const updated = await db.transaction(async (tx) => {
      await assertNoOverlap(booking.carId, booking.startDate, booking.endDate, booking.id);
      const [updated] = await tx
        .update(bookings)
        .set({ status: "approved" })
        .where(eq(bookings.id, input.id))
        .returning();
      await tx.insert(bookingEvents).values({
        bookingId: input.id,
        status: "approved",
        actorId: ctx.session.user.id,
      });
      await tx.insert(payments).values({
        bookingId: input.id,
        userId: booking.userId,
        amount: booking.totalPrice,
      });
      return updated;
    });
    await notify({
      userId: booking.userId,
      email: booking.user.email,
      type: "booking_approved",
      title: "Booking approved",
      message: `Your ${booking.car.make} ${booking.car.model} booking for ${booking.startDate} → ${booking.endDate} has been approved.`,
      link: `/dashboard/bookings/${booking.id}`,
      ctaLabel: "View booking",
    });
    return updated;
  }),

  reject: adminProcedure
    .input(z.object({ id: z.string(), reason: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.id),
        with: { car: true, user: true },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending bookings can be rejected." });
      }
      const updated = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(bookings)
          .set({ status: "rejected" })
          .where(eq(bookings.id, input.id))
          .returning();
        await tx.insert(bookingEvents).values({
          bookingId: input.id,
          status: "rejected",
          actorId: ctx.session.user.id,
          note: input.reason,
        });
        return updated;
      });
      await notify({
        userId: booking.userId,
        email: booking.user.email,
        type: "booking_rejected",
        title: "Booking declined",
        message: `Your booking request for ${booking.car.make} ${booking.car.model} (${booking.startDate} → ${booking.endDate}) was declined.${input.reason ? ` Reason: ${input.reason}` : ""}`,
        link: `/dashboard/bookings/${booking.id}`,
        ctaLabel: "View details",
      });
      return updated;
    }),

  complete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, input.id) });
    if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
    if (booking.status !== "approved") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only approved bookings can be marked completed.",
      });
    }
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(bookings)
        .set({ status: "completed" })
        .where(eq(bookings.id, input.id))
        .returning();
      await tx.insert(bookingEvents).values({
        bookingId: input.id,
        status: "completed",
        actorId: ctx.session.user.id,
      });
      return updated;
    });
  }),
});
