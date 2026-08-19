import type { Metadata } from "next";
import { JobBoard } from "@/components/JobBoard";
import { loadJobs } from "@/lib/jobs";
import { indexPageMetadata } from "@/lib/seo";
import { getActiveSponsoredJobIds, sortJobsWithSponsors } from "@/lib/sponsorships";

export const revalidate = 300;

const title = "Packaging engineer jobs";
const description =
  "Packaging engineer and package-development jobs at CPG and brand employers. Updated daily. Apply on the company career site.";

export const metadata: Metadata = indexPageMetadata({
  title,
  description,
  path: "/",
});

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
          Packaging engineers and package development — not plant ops. Open
          roles at companies like General Mills, Johnson &amp; Johnson, Mars,
          and Clorox. Apply on the company&apos;s career site.
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
      </section>
      <JobBoard jobs={sortedJobs} sponsoredIds={[...sponsoredIds]} />
    </>
  );
}
