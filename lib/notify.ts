import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, user } from "@/db/schema";
import { sendEmail, emailLayout } from "@/lib/email";

const APP_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

type NotificationType =
  | "booking_pending"
  | "booking_approved"
  | "booking_rejected"
  | "payment_paid"
  | "payment_failed";

// Writes the in-app notification and sends the matching email in parallel.
// Both are best-effort (see sendEmail) -- a notification failure should
// never fail the booking/payment action that triggered it.
export async function notify({
  userId,
  email,
  type,
  title,
  message,
  link,
  ctaLabel,
}: {
  userId: string;
  email: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  ctaLabel?: string;
}) {
  await Promise.allSettled([
    db.insert(notifications).values({ userId, type, title, message, link }),
    sendEmail({
      to: email,
      subject: title,
      html: emailLayout({
        heading: title,
        body: message,
        ctaLabel,
        ctaUrl: link ? `${APP_URL}${link}` : undefined,
      }),
    }),
  ]);
}

export async function notifyAdmins(
  params: Omit<Parameters<typeof notify>[0], "userId" | "email">,
) {
  const admins = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.role, "admin"));
  await Promise.allSettled(
    admins.map((admin) => notify({ ...params, userId: admin.id, email: admin.email })),
  );
}
