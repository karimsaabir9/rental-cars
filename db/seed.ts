import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });

  if (existing) {
    if (existing.role !== "admin") {
      await db.update(user).set({ role: "admin" }).where(eq(user.id, existing.id));
      console.log(`Promoted existing user ${email} to admin.`);
    } else {
      console.log(`Admin user ${email} already exists.`);
    }
    return;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await db.update(user).set({ role: "admin" }).where(eq(user.id, result.user.id));

  console.log(`Created admin user ${email}.`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
