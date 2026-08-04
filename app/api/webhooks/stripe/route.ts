import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { notify } from "@/lib/notify";
import { canPay } from "@/lib/payment-rules";

// Source of truth for card payment status -- the client's Checkout redirect
// is just a UX hint, never trusted on its own. Stripe retries webhook
// delivery on failure, so this must be safe to run more than once for the
// same event (see the row lock + canPay check in confirmPayment).
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Webhook not configured", { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (paymentId && session.payment_status === "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
      await confirmPayment(paymentId, paymentIntentId);
    }
  }

  return Response.json({ received: true });
}

async function confirmPayment(paymentId: string, paymentIntentId: string | null) {
  const confirmed = await db.transaction(async (tx) => {
    const [locked] = await tx.select().from(payments).where(eq(payments.id, paymentId)).for("update");
    // Missing row, or already settled (duplicate webhook delivery) -- no-op.
    if (!locked || !canPay(locked.status)) return null;

    const [row] = await tx
      .update(payments)
      .set({
        status: "paid",
        paidAt: new Date(),
        transactionRef: paymentIntentId,
        stripePaymentIntentId: paymentIntentId,
      })
      .where(eq(payments.id, paymentId))
      .returning();
    return row;
  });

  if (!confirmed) return;

  const full = await db.query.payments.findFirst({
    where: eq(payments.id, confirmed.id),
    with: { booking: { with: { car: true } }, user: true },
  });
  if (!full) return;

  const carLabel = `${full.booking.car.make} ${full.booking.car.model}`;
  await notify({
    userId: full.userId,
    email: full.user.email,
    type: "payment_paid",
    title: "Payment received",
    message: `We've received your payment of $${full.amount} for ${carLabel}.`,
    link: `/dashboard/bookings/${full.bookingId}`,
    ctaLabel: "View receipt",
  });
}
