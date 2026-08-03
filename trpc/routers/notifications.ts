import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export const notificationsRouter = createTRPCRouter({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    return db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.session.user.id),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
      limit: 30,
    });
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.session.user.id), eq(notifications.read, false)));
    return Number(row?.count ?? 0);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await db.query.notifications.findFirst({
        where: eq(notifications.id, input.id),
      });
      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, input.id));
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, ctx.session.user.id), eq(notifications.read, false)));
    return { success: true };
  }),
});
