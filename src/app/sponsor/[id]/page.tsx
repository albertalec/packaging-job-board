import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { SponsorCheckoutButton } from "@/components/SponsorCheckoutButton";
import { getJob } from "@/lib/jobs";
import { getSponsorshipForJob } from "@/lib/sponsorships";
import { SPONSOR_DURATION_DAYS, stripeConfigured } from "@/lib/stripe";

export const revalidate = 300;

type Params = { params: Promise<{ id: string }> };
type SearchParams = { searchParams: Promise<{ canceled?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return { title: "Sponsor a job" };
  return {
    title: `Sponsor ${job.title}`,
    description: `Priority placement for ${job.title} at ${job.company} — $100 for ${SPONSOR_DURATION_DAYS} days.`,
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
  const { id } = await params;
  const { canceled } = await searchParams;
  const job = getJob(id);
  if (!job) notFound();

  const sponsorship = await getSponsorshipForJob(job.id);
  const paymentsReady = stripeConfigured();

  return (
    <article className="sponsor-page">
      <p className="kicker">
        <Link href="/sponsor">All listings</Link> / {job.company}
      </p>
      <h1>Sponsor this listing</h1>
      <p className="lede">
        Pin <strong>{job.title}</strong> at {job.company} to the top of a board
        used by packaging engineers and package-development candidates. One
        flat payment for {SPONSOR_DURATION_DAYS} days — no invoice round-trip.
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
            <li>{SPONSOR_DURATION_DAYS} days of priority placement</li>
            <li>Self-serve checkout by credit card</li>
          </ul>
          <p className="sponsor-price">
            <span className="price">$100</span>
            <span className="term">one-time · {SPONSOR_DURATION_DAYS} days</span>
          </p>
          {paymentsReady ? (
            <SponsorCheckoutButton jobId={job.id} />
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
        <a href="mailto:hello@packagingjobboard.com">hello@packagingjobboard.com</a>.
      </p>
    </article>
  );
}
