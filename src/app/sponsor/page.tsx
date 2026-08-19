import type { Metadata } from "next";
import { SponsorPicker } from "@/components/SponsorPicker";
import { loadJobs } from "@/lib/jobs";
import { compareJobsByPromise } from "@/lib/sponsorships";
import { SPONSOR_DURATION_DAYS } from "@/lib/stripe";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sponsor a job",
  description: `Priority placement for $100 — ${SPONSOR_DURATION_DAYS} days at the top of the board.`,
};

export default function SponsorIndexPage() {
  const picks = [...loadJobs().jobs].sort(compareJobsByPromise).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
  }));

  return (
    <article className="sponsor-page">
      <p className="kicker">For employers & recruiters</p>
      <h1>
        $100 to pin a listing for {SPONSOR_DURATION_DAYS} days
      </h1>
      <p className="lede">
        Packaging engineers and package-development candidates already use this
        board. Pay $100 by card to pin a live career-site listing at the top —
        no separate “post a job” round-trip.
      </p>
      <ul className="sponsor-benefits">
        <li>First position on the homepage (above organic listings)</li>
        <li>Sponsored stamp on the card and job detail page</li>
        <li>{`${SPONSOR_DURATION_DAYS}-day run`} — flat fee, no recurring charge</li>
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
