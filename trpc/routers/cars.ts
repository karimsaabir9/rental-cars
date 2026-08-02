import { z } from "zod";
import { and, eq, lte, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { cars } from "@/db/schema";

const carInput = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  category: z.string().min(1),
  pricePerDay: z.number().positive(),
  seats: z.number().int().min(1).max(15),
  transmission: z.enum(["automatic", "manual"]),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid"]),
  licensePlate: z.string().min(1),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export const carsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
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

      return db
        .select()
        .from(cars)
        .where(and(...filters))
        .orderBy(asc(cars.pricePerDay));
    }),

  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const car = await db.query.cars.findFirst({ where: eq(cars.id, input.id) });
    if (!car) throw new TRPCError({ code: "NOT_FOUND" });
    return car;
  }),

  adminList: adminProcedure.query(async () => {
    return db.select().from(cars).orderBy(asc(cars.make));
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

  setAvailability: adminProcedure
    .input(z.object({ id: z.string(), status: z.enum(["available", "unavailable"]) }))
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
