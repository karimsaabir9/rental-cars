import { sql, and, eq, lte, gte } from "drizzle-orm";
import { createTRPCRouter, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { bookings, cars, payments, user } from "@/db/schema";

export const statsRouter = createTRPCRouter({
  overview: adminProcedure.query(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [revenueRow] = await db
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, "paid"));

    const [pendingPaymentsRow] = await db
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, "pending"));

    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "approved"),
          lte(bookings.startDate, today),
          gte(bookings.endDate, today),
        ),
      );

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, "pending"));

    const [fleetRow] = await db.select({ count: sql<number>`count(*)` }).from(cars);
    const [availableRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cars)
      .where(eq(cars.status, "available"));
    const [userRow] = await db.select({ count: sql<number>`count(*)` }).from(user);
    const [bookingRow] = await db.select({ count: sql<number>`count(*)` }).from(bookings);

    const revenueByMonth = await db
      .select({
        month: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.status, "paid"))
      .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`);

    const bookingsByStatus = await db
      .select({ status: bookings.status, count: sql<number>`count(*)` })
      .from(bookings)
      .groupBy(bookings.status);

    // Postgres count(*) is bigint, which the driver returns as a string to
    // avoid unsafe-integer coercion; cast explicitly since these counts are
    // always well within safe-integer range for this app.
    const totalCars = Number(fleetRow?.count ?? 0);
    const activeRentals = Number(activeRow?.count ?? 0);

    return {
      revenue: Number(revenueRow?.total ?? 0),
      pendingPayments: Number(pendingPaymentsRow?.total ?? 0),
      activeRentals,
      pendingApprovals: Number(pendingRow?.count ?? 0),
      totalCars,
      availableCars: Number(availableRow?.count ?? 0),
      totalUsers: Number(userRow?.count ?? 0),
      totalBookings: Number(bookingRow?.count ?? 0),
      fleetUtilization: totalCars > 0 ? activeRentals / totalCars : 0,
      revenueByMonth: revenueByMonth.map((r) => ({ month: r.month, total: Number(r.total) })),
      bookingsByStatus: bookingsByStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    };
  }),
});
