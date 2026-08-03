import { z } from "zod";
import { eq, ne, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

export const usersRouter = createTRPCRouter({
  listAll: adminProcedure.query(async () => {
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.createdAt);
  }),

  // Every account created here is a "user". The seeded admin is the only
  // admin the app will ever have — there is no path, here or in `update`,
  // that can promote an account to admin.
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.email().max(254),
        password: z.string().min(8).max(200),
      }),
    )
    .mutation(async ({ input }) => {
      let createdId: string;
      try {
        const result = await auth.api.signUpEmail({
          body: { name: input.name, email: input.email, password: input.password },
        });
        createdId = result.user.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create user.";
        throw new TRPCError({ code: "CONFLICT", message });
      }

      const [created] = await db.select().from(user).where(eq(user.id, createdId));
      return created;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        email: z.email().max(254).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;

      if (rest.email) {
        const existing = await db.query.user.findFirst({
          where: and(eq(user.email, rest.email), ne(user.id, id)),
        });
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email is already in use." });
        }
      }

      const [updated] = await db
        .update(user)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(user.id, id))
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't delete your own account.",
        });
      }
      await db.delete(user).where(eq(user.id, input.id));
      return { success: true };
    }),
});
