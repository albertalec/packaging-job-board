import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SponsorPicker } from "@/components/SponsorPicker";
import { loadJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { compareJobsByPromise } from "@/lib/sponsorships";
import { formatUsd, getRequestTenant } from "@/lib/tenant";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") return { title: "Sponsor a job" };
  const price = formatUsd(tenant.sponsor.priceCents);
  return buildPageMetadata({
    tenant,
    title: "Sponsor a job",
    description: `Priority placement for ${price} — ${tenant.sponsor.durationDays} days at the top of the board.`,
    path: "/sponsor",
    index: false,
  });
}

export default async function SponsorIndexPage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const price = formatUsd(tenant.sponsor.priceCents);
  const days = tenant.sponsor.durationDays;
  const picks = [...loadJobs(tenant.id).jobs]
    .sort(compareJobsByPromise)
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
    }));

  return (
    <article className="sponsor-page">
      <p className="kicker">For employers & recruiters</p>
      <h1>
        {price} {tenant.copy.sponsorHeadline} {days} days
      </h1>
      <p className="lede">{tenant.copy.sponsorLede}</p>
      <ul className="sponsor-benefits">
        <li>First position on the homepage (above organic listings)</li>
        <li>Sponsored stamp on the card and job detail page</li>
        <li>{`${days}-day run`} — flat fee, no recurring charge</li>
        <li>Ranks on this board only — not the rest of the network</li>
      </ul>
      <h2 className="sponsor-subhead">Pick a live listing</h2>
      <SponsorPicker jobs={picks} />
      <p className="sponsor-footnote">
        Listing not here yet? It appears after the next daily ingest from your
        career-site feed.
      </p>
    </article>
  );
}
