import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingRail } from "@/components/JobCard";
import { SponsorPicker } from "@/components/SponsorPicker";
import { loadJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import {
  compareJobsByPromise,
  getActiveSponsoredJobIds,
} from "@/lib/sponsorships";
import { formatUsd, getRequestTenant } from "@/lib/tenant";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") return { title: "Sponsor a job" };
  const price = formatUsd(tenant.sponsor.priceCents);
  return buildPageMetadata({
    tenant,
    title: "Sponsor a job",
    description: `Pin a live listing on ${tenant.brand.hubLabel ?? tenant.brand.name} for ${price} — ${tenant.sponsor.durationDays} days at the top of the board.`,
    path: "/sponsor",
    index: false,
  });
}

export default async function SponsorIndexPage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const price = formatUsd(tenant.sponsor.priceCents);
  const days = tenant.sponsor.durationDays;
  const boardLabel = tenant.brand.hubLabel ?? tenant.brand.markLine1;
  const duration = days === 30 ? "Thirty" : String(days);
  const sponsoredIds = await getActiveSponsoredJobIds(tenant.id);
  const picks = [...loadJobs(tenant.id).jobs]
    .sort(compareJobsByPromise)
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      rail: listingRail(job.postedAt, sponsoredIds.has(job.id)),
    }));

  return (
    <div className="board-shell board-sponsor-flow">
      <section className="board-sponsor-hero">
        <div className="board-sponsor-copy">
          <p className="board-eyebrow">For employers</p>
          <h1>Pin the listing you already have.</h1>
          <p className="lede">{tenant.copy.sponsorLede}</p>
        </div>
        <aside className="board-price-panel" aria-label="Pricing">
          <p className="board-price-kicker">One pin</p>
          <p className="board-price-amount">{price}</p>
          <p className="board-price-body">
            {duration} days on the {boardLabel} board. Not a second posting
            workflow — the listing you already wrote, in front of the people who
            wrote the spec.
          </p>
        </aside>
      </section>

      <ul className="board-sponsor-grid">
        <li className="board-sponsor-card">
          <p className="board-sponsor-card-title">Your ATS, start to finish</p>
          <p className="board-sponsor-card-body">
            Candidates apply on Workday, Greenhouse or whatever you run. No fake
            apply wall, no resumé database.
          </p>
        </li>
        <li className="board-sponsor-card">
          <p className="board-sponsor-card-title">Scoped to this board</p>
          <p className="board-sponsor-card-body">
            A pin on {boardLabel} appears on {boardLabel}. It doesn&apos;t leak
            across the network.
          </p>
        </li>
        <li className="board-sponsor-card">
          <p className="board-sponsor-card-title">{duration} days, one checkout</p>
          <p className="board-sponsor-card-body">
            {price} flat. One Stripe checkout, one invoice, no seat count and no
            annual contract.
          </p>
        </li>
        <li className="board-sponsor-card">
          <p className="board-sponsor-card-title">Pinned at the top</p>
          <p className="board-sponsor-card-body">
            Pinned badge on the card and detail page. Ranked first on the
            homepage job list for {days} days.
          </p>
        </li>
      </ul>

      <section className="board-sponsor-picker-section">
        <h2 className="board-sponsor-section-head">Pick a live listing</h2>
        <p className="board-sponsor-section-intro">
          Choose a role already on the board from your career-site feed. Checkout
          takes about a minute.
        </p>
        <SponsorPicker jobs={picks} />
        <p className="board-sponsor-footnote">
          Listing not here yet? It appears after the next daily ingest from your
          career-site feed.
        </p>
      </section>
    </div>
  );
}
