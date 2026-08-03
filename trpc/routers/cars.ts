import { z } from "zod";
import { and, eq, lte, gte, asc, inArray, sql, ne, or, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, cars, reviews } from "@/db/schema";
import { CAR_CATEGORY_VALUES } from "@/lib/car-categories";
import { computeCarDisplayStatus } from "@/lib/car-status";

const CAR_SORT_VALUES = ["price_asc", "price_desc", "rating_desc", "popular_desc", "newest"] as const;
type CarSort = (typeof CAR_SORT_VALUES)[number];

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

// "Popular" is measured by how many bookings a car has actually had, not
// just reviews -- most renters never leave one, so review count alone would
// undercount cars that rent well but get skipped at review time.
async function getBookingCounts() {
  const rows = await db
    .select({ carId: bookings.carId, count: sql<number>`count(*)` })
    .from(bookings)
    .where(and(ne(bookings.status, "cancelled"), ne(bookings.status, "rejected")))
    .groupBy(bookings.carId);
  return new Map(rows.map((r) => [r.carId, Number(r.count)]));
}

function sortCars<
  T extends {
    id: string;
    pricePerDay: string;
    avgRating: number | null;
    createdAt: Date;
  },
>(rows: T[], sort: CarSort, bookingCounts: Map<string, number>) {
  const sorted = [...rows];
  switch (sort) {
    case "price_desc":
      return sorted.sort((a, b) => Number(b.pricePerDay) - Number(a.pricePerDay));
    case "rating_desc":
      return sorted.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1));
    case "popular_desc":
      return sorted.sort(
        (a, b) => (bookingCounts.get(b.id) ?? 0) - (bookingCounts.get(a.id) ?? 0),
      );
    case "newest":
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "price_asc":
    default:
      return sorted.sort((a, b) => Number(a.pricePerDay) - Number(b.pricePerDay));
  }
}

export const carsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.enum(CAR_CATEGORY_VALUES).optional(),
          transmission: z.enum(["automatic", "manual"]).optional(),
          make: z.string().max(60).optional(),
          minSeats: z.number().int().min(1).max(15).optional(),
          minPrice: z.number().positive().optional(),
          maxPrice: z.number().positive().optional(),
          search: z.string().max(100).optional(),
          sort: z.enum(CAR_SORT_VALUES).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const filters = [eq(cars.status, "available")];
      if (input?.category) filters.push(eq(cars.category, input.category));
      if (input?.transmission) filters.push(eq(cars.transmission, input.transmission));
      if (input?.make) filters.push(eq(cars.make, input.make));
      if (input?.minSeats) filters.push(gte(cars.seats, input.minSeats));
      if (input?.minPrice) filters.push(gte(cars.pricePerDay, String(input.minPrice)));
      if (input?.maxPrice) filters.push(lte(cars.pricePerDay, String(input.maxPrice)));
      if (input?.search) {
        const term = `%${input.search}%`;
        filters.push(or(ilike(cars.make, term), ilike(cars.model, term))!);
      }

      const [rows, rentedIds, ratingStats, bookingCounts] = await Promise.all([
        db
          .select()
          .from(cars)
          .where(and(...filters)),
        getCurrentlyRentedCarIds(),
        getRatingStats(),
        getBookingCounts(),
      ]);

      const withStats = rows.map((car) =>
        withRatingStats(
          { ...car, displayStatus: computeCarDisplayStatus(car.status, rentedIds.has(car.id)) },
          ratingStats,
        ),
      );
      return sortCars(withStats, input?.sort ?? "price_asc", bookingCounts);
    }),

  listMakes: publicProcedure.query(async () => {
    const rows = await db
      .selectDistinct({ make: cars.make })
      .from(cars)
      .where(eq(cars.status, "available"))
      .orderBy(asc(cars.make));
    return rows.map((r) => r.make);
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
