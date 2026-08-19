import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyLink } from "@/components/ApplyLink";
import { JobDescription } from "@/components/JobDescription";
import { JsonLd } from "@/components/JsonLd";
import { getJob, loadJobs } from "@/lib/jobs";
import { buildJobPostingJsonLd } from "@/lib/job-posting-jsonld";
import { formatNiche } from "@/lib/niches";
import { indexPageMetadata } from "@/lib/seo";
import { getSponsorshipForJob } from "@/lib/sponsorships";
import { parsePostedAt } from "@/lib/job-dates";

export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return loadJobs().jobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return { title: "Job not found" };
  const title = `${job.title} at ${job.company}`;
  const description = `${job.title} — ${job.location}. Apply on the employer ATS.`;
  return indexPageMetadata({
    title,
    description,
    path: `/jobs/${job.id}`,
  });
}

function formatPosted(postedAt: string | null) {
  const parsed = parsePostedAt(postedAt);
  if (parsed) {
    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  if (postedAt) return postedAt;
  return "Date not listed";
}

export default async function JobPage({ params }: Params) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  const sponsorship = await getSponsorshipForJob(job.id);
  const niche = formatNiche(job.niche);

  return (
    <>
      <JsonLd data={buildJobPostingJsonLd(job)} />
      <article className="spec">
        <p className="kicker">
          <Link href="/">All jobs</Link> / {job.company}
        </p>
        {sponsorship ? <span className="stamp sponsor-stamp">Sponsored</span> : null}
        <h1>{job.title}</h1>
        <ul className="spec-meta">
          <li>{job.company}</li>
          <li>{job.location}</li>
          <li>Posted {formatPosted(job.postedAt)}</li>
          {niche ? <li>{niche}</li> : null}
          {job.salary ? <li>{job.salary}</li> : null}
        </ul>
        <div className="spec-actions">
          <ApplyLink
            className="apply big"
            href={job.applyUrl}
            jobId={job.id}
            company={job.company}
          >
            Apply on {job.company} careers
          </ApplyLink>
          {!sponsorship ? (
            <Link className="ghost big" href={`/sponsor/${job.id}`}>
              Sponsor this listing — $100
            </Link>
          ) : null}
        </div>
        <JobDescription text={job.description} />
        <div className="spec-actions">
          <ApplyLink
            className="apply big"
            href={job.applyUrl}
            jobId={job.id}
            company={job.company}
          >
            Apply on {job.company} careers
          </ApplyLink>
        </div>
      </article>
    </>
  );
}
