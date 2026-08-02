import { createTRPCRouter } from "@/trpc/init";
import { carsRouter } from "@/trpc/routers/cars";
import { bookingsRouter } from "@/trpc/routers/bookings";
import { usersRouter } from "@/trpc/routers/users";
import { statsRouter } from "@/trpc/routers/stats";

export const appRouter = createTRPCRouter({
  cars: carsRouter,
  bookings: bookingsRouter,
  users: usersRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
