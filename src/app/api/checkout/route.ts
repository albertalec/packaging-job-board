import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import {
  formatUsd,
  originFromRequest,
  tenantFromRequest,
} from "@/lib/tenant";

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

  let tenant;
  try {
    tenant = tenantFromRequest(request);
  } catch {
    return NextResponse.json({ error: "Unknown host." }, { status: 404 });
  }

  if (tenant.kind !== "vertical") {
    return NextResponse.json(
      { error: "Sponsorship checkout is only available on a vertical board." },
      { status: 400 },
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

  const job = getJob(jobId, tenant.id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const origin = originFromRequest(request);
  const host =
    request.headers.get("x-tenant-host") ??
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    tenant.canonicalHost;
  const stripe = getStripe();
  const { priceCents, durationDays } = tenant.sponsor;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: priceCents,
          product_data: {
            name: `Sponsor: ${job.title}`,
            description: `${durationDays}-day priority placement for ${job.company} on ${tenant.brand.name}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      vertical: tenant.id,
      tier: "sponsor",
      host,
    },
    success_url: `${origin}/sponsor/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/sponsor/${job.id}?canceled=1`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not create a checkout session." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url, price: formatUsd(priceCents) });
}
