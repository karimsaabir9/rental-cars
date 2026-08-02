import { sql, and, eq, lte, gte, inArray } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, cars } from "@/db/schema";

export const statsRouter = createTRPCRouter({
  overview: adminProcedure.query(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [revenueRow] = await db
      .select({ total: sql<string>`coalesce(sum(${bookings.totalPrice}), 0)` })
      .from(bookings)
      .where(inArray(bookings.status, ["confirmed", "completed"]));

    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          lte(bookings.startDate, today),
          gte(bookings.endDate, today),
        ),
      );

    const [fleetRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cars);

    const revenueByMonth = await db
      .select({
        month: sql<string>`to_char(${bookings.createdAt}, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${bookings.totalPrice}), 0)`,
      })
      .from(bookings)
      .where(inArray(bookings.status, ["confirmed", "completed"]))
      .groupBy(sql`to_char(${bookings.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${bookings.createdAt}, 'YYYY-MM')`);

    const totalCars = fleetRow?.count ?? 0;
    const activeRentals = activeRow?.count ?? 0;

    return {
      revenue: Number(revenueRow?.total ?? 0),
      activeRentals,
      totalCars,
      fleetUtilization: totalCars > 0 ? activeRentals / totalCars : 0,
      revenueByMonth: revenueByMonth.map((r) => ({ month: r.month, total: Number(r.total) })),
    };
  }),
});
