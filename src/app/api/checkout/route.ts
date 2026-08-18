import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";
import { siteUrl } from "@/lib/site";
import {
  getStripe,
  SPONSOR_DURATION_DAYS,
  SPONSOR_PRICE_CENTS,
  stripeConfigured,
} from "@/lib/stripe";

export const runtime = "nodejs";

type CheckoutBody = {
  jobId?: string;
};

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const jobId = body.jobId?.trim();
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const origin = siteUrl();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: SPONSOR_PRICE_CENTS,
          product_data: {
            name: `Sponsor: ${job.title}`,
            description: `${SPONSOR_DURATION_DAYS}-day priority placement for ${job.company} on Packaging Job Board`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
    },
    customer_email: undefined,
    success_url: `${origin}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/sponsor/${job.id}?canceled=1`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not create a checkout session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
