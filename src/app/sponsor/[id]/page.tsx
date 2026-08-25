import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { SponsorCheckoutButton } from "@/components/SponsorCheckoutButton";
import { getJob } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
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
  if (!job) {
    return buildPageMetadata({
      tenant,
      title: "Sponsor a job",
      description: "Priority placement for a live listing.",
      path: "/sponsor",
      index: false,
    });
  }
  const price = formatUsd(tenant.sponsor.priceCents);
  return buildPageMetadata({
    tenant,
    title: `Sponsor ${job.title}`,
    description: `Priority placement for ${job.title} at ${job.company} — ${price} for ${tenant.sponsor.durationDays} days.`,
    path: `/sponsor/${job.id}`,
    index: false,
  });
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
  const boardLabel = tenant.brand.hubLabel ?? tenant.brand.markLine1;
  const duration = days === 30 ? "Thirty" : String(days);

  return (
    <div className="board-shell board-sponsor-flow">
      <p className="board-sponsor-crumb">
        <Link href="/sponsor">All listings</Link>
        <span aria-hidden="true"> / </span>
        {job.company}
      </p>

      <section className="board-sponsor-checkout">
        <div className="board-sponsor-checkout-main">
          <h1>Sponsor this listing</h1>
          <p className="lede">
            Pin <strong>{job.title}</strong> at {job.company} to the top of the{" "}
            {boardLabel} board. One flat payment for {days} days — candidates
            finish on your ATS.
          </p>

          {canceled ? (
            <p className="board-sponsor-notice">
              Checkout was canceled. You can try again when ready.
            </p>
          ) : null}

          <h2 className="board-sponsor-section-head">How it looks on the board</h2>
          <div className="board-sponsor-preview">
            <JobCard job={job} sponsored />
          </div>
        </div>

        <aside className="board-sponsor-sidebar" aria-label="Checkout">
          {sponsorship ? (
            <div className="board-sponsor-active">
              <span className="job-tag job-tag-pinned">Pinned</span>
              <p className="board-sponsor-active-title">Already sponsored</p>
              <p className="board-sponsor-active-body">
                This job is pinned through{" "}
                <strong>{formatExpiry(sponsorship.expiresAt)}</strong>.
              </p>
              <Link className="board-btn board-btn-ghost" href={`/jobs/${job.id}`}>
                View listing
              </Link>
            </div>
          ) : (
            <>
              <p className="board-price-kicker">One pin</p>
              <p className="board-price-amount board-sponsor-price">{price}</p>
              <p className="board-sponsor-sidebar-term">
                one-time · {days} days on {boardLabel}
              </p>
              <ul className="board-sponsor-sidebar-list">
                <li>Ranked first on the homepage</li>
                <li>Pinned badge on card and detail page</li>
                <li>{duration} days of priority placement</li>
                <li>Self-serve checkout by card</li>
              </ul>
              {paymentsReady ? (
                <SponsorCheckoutButton jobId={job.id} priceLabel={price} />
              ) : (
                <p className="board-sponsor-notice">
                  Stripe is not configured yet. Add{" "}
                  <code>STRIPE_SECRET_KEY</code> to enable checkout.
                </p>
              )}
            </>
          )}
        </aside>
      </section>

      <p className="board-sponsor-footnote">
        Questions? Email{" "}
        <a href={`mailto:${tenant.contactEmail}`}>{tenant.contactEmail}</a>.
      </p>
    </div>
  );
}
