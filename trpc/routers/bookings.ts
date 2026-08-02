import { z } from "zod";
import { and, eq, lte, gte, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, cars } from "@/db/schema";

const dateRangeInput = z.object({
  carId: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

async function assertNoOverlap(carId: string, startDate: string, endDate: string, excludeBookingId?: string) {
  const overlapping = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.carId, carId),
      eq(bookings.status, "confirmed"),
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
    if (input.endDate < input.startDate) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date." });
    }

    const car = await db.query.cars.findFirst({ where: eq(cars.id, input.carId) });
    if (!car) throw new TRPCError({ code: "NOT_FOUND" });
    if (car.status !== "available") {
      throw new TRPCError({ code: "CONFLICT", message: "Car is not available." });
    }

    return db.transaction(async (tx) => {
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
        })
        .returning();

      return created;
    });
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return db.query.bookings.findMany({
      where: eq(bookings.userId, ctx.session.user.id),
      with: { car: true },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }),

  cancelMine: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, input.id) });
      if (!booking || booking.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const [updated] = await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.id))
        .returning();
      return updated;
    }),

  listAll: adminProcedure.query(async () => {
    return db.query.bookings.findMany({
      with: { car: true, user: true },
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.enum(["confirmed", "completed", "cancelled"]) }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(bookings)
        .set({ status: input.status })
        .where(eq(bookings.id, input.id))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),
});
