import { z } from "zod";
import { and, eq, lte, gte, asc, inArray, sql, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, cars, reviews } from "@/db/schema";
import { CAR_CATEGORY_VALUES } from "@/lib/car-categories";
import { computeCarDisplayStatus } from "@/lib/car-status";
import { logAudit } from "@/lib/audit";
import { matchesCarFilters } from "@/lib/car-filters";

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
    // ISO 8601 strings sort correctly with plain string comparison, so the
    // cached base data (see getCachedAvailableCars below) can carry
    // createdAt as a string rather than a Date -- unstable_cache's return
    // value has to be JSON-serializable, and Date doesn't round-trip
    // through that safely.
    createdAt: string;
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
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price_asc":
    default:
      return sorted.sort((a, b) => Number(a.pricePerDay) - Number(b.pricePerDay));
  }
}

// The DB round-trip for cars.list is identical across every filter/sort
// combination -- only the WHERE clause the caller wants varies, and that's
// cheap to apply in JS afterward. Caching per unique filter combination
// wouldn't work well anyway since free-text search alone has unbounded
// values. So this caches just the shared base fetch (all available cars +
// rating stats + rented-car ids + booking counts) and callers filter/sort
// the cached result in memory.
//
// Map/Set aren't JSON-serializable, so they're flattened to arrays/entries
// here and reconstructed by the caller. Tagged "cars" so every mutation
// that can change the result (create/update/setStatus/delete) invalidates
// it immediately via revalidateTag -- the 60s revalidate window is just a
// safety net in case an invalidation call is ever missed.
const getCachedAvailableCarsBase = nextCache(
  async () => {
    const [rows, rentedIds, ratingStats, bookingCounts] = await Promise.all([
      db.select().from(cars).where(eq(cars.status, "available")),
      getCurrentlyRentedCarIds(),
      getRatingStats(),
      getBookingCounts(),
    ]);
    return {
      rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      rentedIds: [...rentedIds],
      ratingStats: [...ratingStats.entries()],
      bookingCounts: [...bookingCounts.entries()],
    };
  },
  ["cars-list-available-base"],
  { tags: ["cars"], revalidate: 60 },
);

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
      const base = await getCachedAvailableCarsBase();
      const rentedIds = new Set(base.rentedIds);
      const ratingStats = new Map(base.ratingStats);
      const bookingCounts = new Map(base.bookingCounts);

      const withStats = base.rows.filter((car) => matchesCarFilters(car, input)).map((car) =>
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
      db.select().from(cars).orderBy(asc(cars.make)).limit(500),
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
    // { expire: 0 } forces immediate expiration. The recommended "max"
    // profile only gives stale-while-revalidate (the next read can still
    // return stale data while a background refresh happens), which isn't
    // good enough here -- an admin toggling a car's status expects the
    // public listing to reflect it right away, not after one more stale hit.
    revalidateTag("cars", { expire: 0 });
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
      revalidateTag("cars", { expire: 0 });
      return updated;
    }),

  setStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.enum(["available", "maintenance"]) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.cars.findFirst({ where: eq(cars.id, input.id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const [updated] = await db
        .update(cars)
        .set({ status: input.status })
        .where(eq(cars.id, input.id))
        .returning();

      await logAudit({
        entityType: "car",
        entityId: input.id,
        action: "status_changed",
        actorId: ctx.session.user.id,
        metadata: { from: existing.status, to: input.status },
      });

      revalidateTag("cars", { expire: 0 });
      return updated;
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Bookings/payments/reviews all cascade-delete on cars.id, so an
    // unconditional delete here would silently wipe booking and revenue
    // history. Once a car has ever been booked, retire it via status
    // instead -- only a car with zero booking history can be hard-deleted.
    const existing = await db.query.cars.findFirst({ where: eq(cars.id, input.id) });
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
    const hasBooking = await db.query.bookings.findFirst({
      where: eq(bookings.carId, input.id),
    });
    if (hasBooking) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "This car has booking history and can't be deleted. Mark it as unavailable instead.",
      });
    }
    await db.delete(cars).where(eq(cars.id, input.id));

    await logAudit({
      entityType: "car",
      entityId: input.id,
      action: "deleted",
      actorId: ctx.session.user.id,
      metadata: { make: existing.make, model: existing.model, licensePlate: existing.licensePlate },
    });

    revalidateTag("cars", "max");
    return { success: true };
  }),
});
