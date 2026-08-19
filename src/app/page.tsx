import type { Metadata } from "next";
import Link from "next/link";
import { JobBoard } from "@/components/JobBoard";
import { loadJobs } from "@/lib/jobs";
import { getActiveSponsoredJobIds, sortJobsWithSponsors } from "@/lib/sponsorships";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Packaging engineer jobs",
  description:
    "Packaging engineer and package-development jobs at top employers. Updated daily. Apply on the company career site.",
};

export default async function HomePage() {
  const { jobs, ingestedAt, total } = loadJobs();
  const sponsoredIds = await getActiveSponsoredJobIds();
  const sortedJobs = sortJobsWithSponsors(jobs, sponsoredIds);
  const employersHiring = new Set(jobs.map((job) => job.company)).size;
  const ingestedLabel = ingestedAt
    ? new Date(ingestedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "not yet run";

  return (
    <>
      <section className="hero">
        <p className="kicker">Updated daily</p>
        <h1>Packaging engineer jobs at top employers.</h1>
        <p className="lede">
          Open packaging engineer and package-development roles at companies
          like Procter &amp; Gamble, 3M, Amazon, and General Mills. Apply on the
          company&apos;s career site.
        </p>
        <dl className="stats">
          <div>
            <dt>Live roles</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>Employers hiring</dt>
            <dd>{employersHiring}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{ingestedLabel}</dd>
          </div>
        </dl>
        <p className="sponsor-cta">
          Hiring a packaging engineer?{" "}
          <Link href="/sponsor">Sponsor the listing for $100</Link> — pin it for
          30 days.
        </p>
      </section>
      <JobBoard jobs={sortedJobs} sponsoredIds={[...sponsoredIds]} />
    </>
  );
}
