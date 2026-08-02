import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { reviews, bookings } from "@/db/schema";

// A rental is only reviewable once it has actually happened. "confirmed" is
// the legacy instant-book status, which also implied a settled rental.
const SETTLED_STATUSES = ["confirmed", "completed"] as const;

async function assertHasRentedCar(userId: string, carId: string) {
  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.userId, userId),
      eq(bookings.carId, carId),
      inArray(bookings.status, SETTLED_STATUSES),
    ),
  });
  if (!booking) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only review cars you've completed a rental for.",
    });
  }
}

const reviewInput = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewsRouter = createTRPCRouter({
  listByCar: publicProcedure.input(z.object({ carId: z.string() })).query(async ({ input }) => {
    return db.query.reviews.findMany({
      where: eq(reviews.carId, input.carId),
      with: { user: true },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
  }),

  getMine: protectedProcedure.input(z.object({ carId: z.string() })).query(async ({ ctx, input }) => {
    const review = await db.query.reviews.findFirst({
      where: and(eq(reviews.carId, input.carId), eq(reviews.userId, ctx.session.user.id)),
    });
    return review ?? null;
  }),

  canReview: protectedProcedure
    .input(z.object({ carId: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.userId, ctx.session.user.id),
          eq(bookings.carId, input.carId),
          inArray(bookings.status, SETTLED_STATUSES),
        ),
      });
      return { eligible: !!booking };
    }),

  create: protectedProcedure
    .input(reviewInput.extend({ carId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertHasRentedCar(ctx.session.user.id, input.carId);
      const existing = await db.query.reviews.findFirst({
        where: and(eq(reviews.carId, input.carId), eq(reviews.userId, ctx.session.user.id)),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You've already reviewed this car." });
      }
      const [created] = await db
        .insert(reviews)
        .values({
          carId: input.carId,
          userId: ctx.session.user.id,
          rating: input.rating,
          comment: input.comment,
        })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(reviewInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const review = await db.query.reviews.findFirst({ where: eq(reviews.id, input.id) });
      if (!review || review.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const [updated] = await db
        .update(reviews)
        .set({ rating: input.rating, comment: input.comment, updatedAt: new Date() })
        .where(eq(reviews.id, input.id))
        .returning();
      return updated;
    }),

  deleteMine: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const review = await db.query.reviews.findFirst({ where: eq(reviews.id, input.id) });
      if (!review || review.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),

  listAll: adminProcedure.query(async () => {
    return db.query.reviews.findMany({
      with: { car: true, user: true },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
  }),

  deleteAny: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await db.delete(reviews).where(eq(reviews.id, input.id));
    return { success: true };
  }),
});
