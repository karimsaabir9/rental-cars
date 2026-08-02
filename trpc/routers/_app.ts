import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "@/trpc/init";
import { carsRouter } from "@/trpc/routers/cars";
import { bookingsRouter } from "@/trpc/routers/bookings";
import { usersRouter } from "@/trpc/routers/users";
import { statsRouter } from "@/trpc/routers/stats";
import { paymentsRouter } from "@/trpc/routers/payments";

export const appRouter = createTRPCRouter({
  cars: carsRouter,
  bookings: bookingsRouter,
  users: usersRouter,
  stats: statsRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
