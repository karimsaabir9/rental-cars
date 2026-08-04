import { createTRPCRouter, adminProcedure } from "@/trpc/init";
import { db } from "@/db";

export const auditLogRouter = createTRPCRouter({
  // See bookings.listAll for why this is capped rather than paginated at
  // the query layer.
  listAll: adminProcedure.query(async () => {
    return db.query.auditLog.findMany({
      with: { actor: true },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: 500,
    });
  }),
});
