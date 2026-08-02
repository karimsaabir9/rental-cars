import { createTRPCRouter, adminProcedure } from "@/trpc/init";
import { db } from "@/db";
import { user } from "@/db/schema";

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
});
