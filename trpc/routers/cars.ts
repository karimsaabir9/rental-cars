import { z } from "zod";
import { and, eq, lte, gte, asc, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, cars, reviews } from "@/db/schema";
import { CAR_CATEGORY_VALUES } from "@/lib/car-categories";
import { computeCarDisplayStatus } from "@/lib/car-status";

const carInput = z.object({
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  category: z.enum(CAR_CATEGORY_VALUES),
  pricePerDay: z.number().positive().max(100000),
  seats: z.number().int().min(1).max(15),
  transmission: z.enum(["automatic", "manual"]),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid"]),
  licensePlate: z.string().min(1).max(20),
  imageUrl: z.string().url().max(2048).optional(),
  description: z.string().max(2000).optional(),
});

// Cars with an approved booking covering today. Kept as a set lookup so list
// queries can compute a display status without N+1 subqueries.
async function getCurrentlyRentedCarIds() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({ carId: bookings.carId })
    .from(bookings)
    .where(and(eq(bookings.status, "approved"), lte(bookings.startDate, today), gte(bookings.endDate, today)));
  return new Set(rows.map((r) => r.carId));
}

type RatingStats = { avgRating: number; reviewCount: number };

// Aggregated per car so list queries don't need N+1 subqueries.
async function getRatingStats() {
  const rows = await db
    .select({
      carId: reviews.carId,
      avgRating: sql<string>`avg(${reviews.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .groupBy(reviews.carId);
  const map = new Map<string, RatingStats>();
  for (const row of rows) {
    map.set(row.carId, { avgRating: Number(row.avgRating), reviewCount: Number(row.count) });
  }
  return map;
}

function withRatingStats<T extends { id: string }>(car: T, stats: Map<string, RatingStats>) {
  const s = stats.get(car.id);
  return { ...car, avgRating: s?.avgRating ?? null, reviewCount: s?.reviewCount ?? 0 };
}

export const carsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.enum(CAR_CATEGORY_VALUES).optional(),
          transmission: z.enum(["automatic", "manual"]).optional(),
          maxPrice: z.number().positive().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const filters = [eq(cars.status, "available")];
      if (input?.category) filters.push(eq(cars.category, input.category));
      if (input?.transmission) filters.push(eq(cars.transmission, input.transmission));
      if (input?.maxPrice) filters.push(lte(cars.pricePerDay, String(input.maxPrice)));

      const [rows, rentedIds, ratingStats] = await Promise.all([
        db
          .select()
          .from(cars)
          .where(and(...filters))
          .orderBy(asc(cars.pricePerDay)),
        getCurrentlyRentedCarIds(),
        getRatingStats(),
      ]);

      return rows.map((car) =>
        withRatingStats(
          { ...car, displayStatus: computeCarDisplayStatus(car.status, rentedIds.has(car.id)) },
          ratingStats,
        ),
      );
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const car = await db.query.cars.findFirst({ where: eq(cars.id, input.id) });
    if (!car) throw new TRPCError({ code: "NOT_FOUND" });
    const [rentedIds, ratingStats] = await Promise.all([getCurrentlyRentedCarIds(), getRatingStats()]);
    return withRatingStats(
      { ...car, displayStatus: computeCarDisplayStatus(car.status, rentedIds.has(car.id)) },
      ratingStats,
    );
  }),

  getAvailability: publicProcedure
    .input(z.object({ carId: z.string() }))
    .query(async ({ input }) => {
      return db
        .select({ startDate: bookings.startDate, endDate: bookings.endDate })
        .from(bookings)
        .where(
          and(
            eq(bookings.carId, input.carId),
            inArray(bookings.status, ["confirmed", "pending", "approved"]),
          ),
        )
        .orderBy(asc(bookings.startDate));
    }),

  adminList: adminProcedure.query(async () => {
    const [rows, rentedIds, ratingStats] = await Promise.all([
      db.select().from(cars).orderBy(asc(cars.make)),
      getCurrentlyRentedCarIds(),
      getRatingStats(),
    ]);
    return rows.map((car) =>
      withRatingStats(
        { ...car, displayStatus: computeCarDisplayStatus(car.status, rentedIds.has(car.id)) },
        ratingStats,
      ),
    );
  }),

  create: adminProcedure.input(carInput).mutation(async ({ input }) => {
    const [created] = await db
      .insert(cars)
      .values({ ...input, pricePerDay: String(input.pricePerDay) })
      .returning();
    return created;
  }),

  update: adminProcedure
    .input(carInput.partial().extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const [updated] = await db
        .update(cars)
        .set({
          ...rest,
          pricePerDay: rest.pricePerDay !== undefined ? String(rest.pricePerDay) : undefined,
        })
        .where(eq(cars.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  setStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.enum(["available", "maintenance"]) }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(cars)
        .set({ status: input.status })
        .where(eq(cars.id, input.id))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    await db.delete(cars).where(eq(cars.id, input.id));
    return { success: true };
  }),
});
