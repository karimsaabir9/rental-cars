import { sql } from "drizzle-orm";
import { db } from "@/db";

// Uptime monitors hit this to distinguish "app is up" from "app is up but
// can't reach the database" -- a plain 200 from Next itself doesn't tell you
// that.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
