import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "@/trpc/init";
import { carsRouter } from "@/trpc/routers/cars";
import { bookingsRouter } from "@/trpc/routers/bookings";
import { usersRouter } from "@/trpc/routers/users";
import { statsRouter } from "@/trpc/routers/stats";
import { paymentsRouter } from "@/trpc/routers/payments";
import { reviewsRouter } from "@/trpc/routers/reviews";
import { notificationsRouter } from "@/trpc/routers/notifications";
import { auditLogRouter } from "@/trpc/routers/audit-log";

export const appRouter = createTRPCRouter({
  cars: carsRouter,
  bookings: bookingsRouter,
  users: usersRouter,
  stats: statsRouter,
  payments: paymentsRouter,
  reviews: reviewsRouter,
  notifications: notificationsRouter,
  auditLog: auditLogRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
