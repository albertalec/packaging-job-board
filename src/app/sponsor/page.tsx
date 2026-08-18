import type { Metadata } from "next";
import Link from "next/link";
import { loadJobs } from "@/lib/jobs";
import { SPONSOR_DURATION_DAYS } from "@/lib/stripe";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sponsor a job",
  description: `Priority placement for $100 — ${SPONSOR_DURATION_DAYS} days at the top of the board.`,
};

export default function SponsorIndexPage() {
  const { jobs } = loadJobs();
  const sample = [...jobs]
    .sort((left, right) => {
      const leftPosted = left.postedAt ? Date.parse(left.postedAt) : 0;
      const rightPosted = right.postedAt ? Date.parse(right.postedAt) : 0;
      return rightPosted - leftPosted;
    })
    .slice(0, 12);

  return (
    <article className="sponsor-page">
      <p className="kicker">For employers & recruiters</p>
      <h1>Sponsor a packaging role for ${SPONSOR_DURATION_DAYS} days</h1>
      <p className="lede">
        Already on the board via your ATS feed? Pay $100 by card to pin your listing at the
        top with a sponsored badge. No sales call required.
      </p>
      <ul className="sponsor-benefits">
        <li>First position on the homepage (above organic listings)</li>
        <li>Sponsored stamp on the card and job detail page</li>
        <li>{SPONSOR_DURATION_DAYS}-day run — flat fee, no recurring charge</li>
      </ul>
      <h2 className="sponsor-subhead">Pick a live listing</h2>
      {sample.length === 0 ? (
        <p className="empty">No live roles yet. Run ingest, then return here to sponsor.</p>
      ) : (
        <ul className="sponsor-pick-list">
          {sample.map((job) => (
            <li key={job.id}>
              <Link href={`/sponsor/${job.id}`}>
                <span className="pick-title">{job.title}</span>
                <span className="pick-meta">
                  {job.company} · {job.location}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="sponsor-footnote">
        Listing not here yet? It appears after the next daily ingest from your career-site
        feed.
      </p>
    </article>
  );
}
