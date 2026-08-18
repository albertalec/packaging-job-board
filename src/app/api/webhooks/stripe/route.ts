import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addSponsorship } from "@/lib/sponsorship-store";
import {
  getStripe,
  SPONSOR_DURATION_DAYS,
  stripeConfigured,
} from "@/lib/stripe";

export const runtime = "nodejs";

function sponsorshipWindow(now = new Date()) {
  const sponsoredAt = now.toISOString();
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + SPONSOR_DURATION_DAYS);
  return { sponsoredAt, expiresAt: expiresAt.toISOString() };
}

async function activateFromSession(session: Stripe.Checkout.Session) {
  const jobId = session.metadata?.jobId;
  if (!jobId || session.payment_status !== "paid") return;

  const { sponsoredAt, expiresAt } = sponsorshipWindow();

  await addSponsorship({
    jobId,
    sponsoredAt,
    expiresAt,
    stripeSessionId: session.id,
    payerEmail: session.customer_details?.email ?? session.customer_email,
  });
}

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await activateFromSession(session);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await activateFromSession(session);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    console.error("Stripe webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
