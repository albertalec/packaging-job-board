import type { Metadata } from "next";
import { JobBoard } from "@/components/JobBoard";
import { loadJobs } from "@/lib/jobs";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Packaging Job Board",
  description:
    "Fresh packaging engineer and packaging manager roles, ingested from employer ATS feeds — not LinkedIn.",
};

export default function HomePage() {
  const { jobs, ingestedAt, total } = loadJobs();
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
        <p className="kicker">Employer ATS feeds · refreshed daily</p>
        <h1>Packaging jobs, pulled while they are still open.</h1>
        <p className="lede">
          A focused board for packaging engineers, packaging managers, and
          adjacent roles. Listings come from Workday, Greenhouse, Amazon Jobs,
          and other employer career-site APIs — never LinkedIn.
        </p>
        <dl className="stats">
          <div>
            <dt>Live packaging roles</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>Last ingest</dt>
            <dd>{ingestedLabel}</dd>
          </div>
        </dl>
      </section>
      <JobBoard jobs={jobs} />
    </>
  );
}
