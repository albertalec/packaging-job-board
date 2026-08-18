import type { Metadata } from "next";
import Link from "next/link";
import { JobBoard } from "@/components/JobBoard";
import { loadJobs } from "@/lib/jobs";
import { getActiveSponsoredJobIds, sortJobsWithSponsors } from "@/lib/sponsorships";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Packaging engineers & package development jobs",
  description:
    "Brand-side CPG packaging R&D and packaging engineer roles, ingested daily from employer ATS feeds. Apply on the career site — not a login wall.",
};

export default async function HomePage() {
  const { jobs, ingestedAt, total } = loadJobs();
  const sponsoredIds = await getActiveSponsoredJobIds();
  const sortedJobs = sortJobsWithSponsors(jobs, sponsoredIds);
  const brandSide = jobs.filter(
    (job) => job.niche === "cpg" || job.niche === "food-beverage",
  ).length;
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
        <p className="kicker">CPG brand-side packaging R&D · ATS feeds, daily</p>
        <h1>Packaging engineers. Package development. Not plant oilers.</h1>
        <p className="lede">
          Brand-side roles at CPG and food companies — package development,
          packaging R&amp;D, packaging engineers — pulled from employer career
          sites while they are still open. Apply on Workday or Greenhouse. No
          login wall, no “every job at a box plant.”
        </p>
        <ul className="contrast">
          <li>
            <strong>On this board:</strong> packaging engineer, package
            development, packaging R&amp;D and packaging manager.
          </li>
          <li>
            <strong>Not here:</strong> oilers, HRIS, EHS interns, or night-shift
            finishing because the employer happens to make packaging.
          </li>
        </ul>
        <dl className="stats">
          <div>
            <dt>Live packaging-engineer roles</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>CPG / food &amp; beverage</dt>
            <dd>{brandSide}</dd>
          </div>
          <div>
            <dt>Last ingest</dt>
            <dd>{ingestedLabel}</dd>
          </div>
        </dl>
        <p className="sponsor-cta">
          Hiring a packaging engineer?{" "}
          <Link href="/sponsor">Sponsor the listing for $100</Link> — pin it for
          30 days. You already posted it on your ATS.
        </p>
      </section>
      <JobBoard jobs={sortedJobs} sponsoredIds={[...sponsoredIds]} />
    </>
  );
}
