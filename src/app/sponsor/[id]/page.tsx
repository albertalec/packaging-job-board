import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { SponsorCheckoutButton } from "@/components/SponsorCheckoutButton";
import { getJob } from "@/lib/jobs";
import { getSponsorshipForJob } from "@/lib/sponsorships";
import { stripeConfigured } from "@/lib/stripe";
import { formatUsd, getRequestTenant } from "@/lib/tenant";

export const revalidate = 300;

type Params = { params: Promise<{ id: string }> };
type SearchParams = { searchParams: Promise<{ canceled?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") return { title: "Sponsor a job" };
  const { id } = await params;
  const job = getJob(id, tenant.id);
  if (!job) return { title: "Sponsor a job" };
  const price = formatUsd(tenant.sponsor.priceCents);
  return {
    title: `Sponsor ${job.title}`,
    description: `Priority placement for ${job.title} at ${job.company} — ${price} for ${tenant.sponsor.durationDays} days.`,
  };
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SponsorJobPage({ params, searchParams }: Params & SearchParams) {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const { id } = await params;
  const { canceled } = await searchParams;
  const job = getJob(id, tenant.id);
  if (!job) notFound();

  const sponsorship = await getSponsorshipForJob(job.id, tenant.id);
  const paymentsReady = stripeConfigured();
  const price = formatUsd(tenant.sponsor.priceCents);
  const days = tenant.sponsor.durationDays;

  return (
    <article className="sponsor-page">
      <p className="kicker">
        <Link href="/sponsor">All listings</Link> / {job.company}
      </p>
      <h1>Sponsor this listing</h1>
      <p className="lede">
        Pin <strong>{job.title}</strong> at {job.company} to the top of{" "}
        {tenant.brand.name}. One flat payment for {days} days — no invoice
        round-trip. The pin stays on this board only.
      </p>

      {canceled ? (
        <p className="notice">Checkout was canceled. You can try again when ready.</p>
      ) : null}

      <h2 className="sponsor-subhead">How it looks on the board</h2>
      <div className="sponsor-preview">
        <JobCard job={job} sponsored compact />
      </div>

      {sponsorship ? (
        <div className="sponsor-active">
          <p className="stamp sponsor-stamp">Sponsored</p>
          <p>
            This job is sponsored through <strong>{formatExpiry(sponsorship.expiresAt)}</strong>.
          </p>
          <Link className="ghost" href={`/jobs/${job.id}`}>
            View listing
          </Link>
        </div>
      ) : (
        <>
          <ul className="sponsor-benefits">
            <li>Ranked first on the homepage job list</li>
            <li>Sponsored badge on the card and detail page</li>
            <li>{days} days of priority placement</li>
            <li>Self-serve checkout by credit card</li>
          </ul>
          <p className="sponsor-price">
            <span className="price">{price}</span>
            <span className="term">one-time · {days} days</span>
          </p>
          {paymentsReady ? (
            <SponsorCheckoutButton jobId={job.id} priceLabel={price} />
          ) : (
            <p className="notice">
              Stripe is not configured yet. Add <code>STRIPE_SECRET_KEY</code> to enable
              checkout.
            </p>
          )}
        </>
      )}

      <p className="sponsor-footnote">
        Questions? Email{" "}
        <a href={`mailto:${tenant.contactEmail}`}>{tenant.contactEmail}</a>.
      </p>
    </article>
  );
}
