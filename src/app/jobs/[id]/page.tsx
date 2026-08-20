import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobDescription } from "@/components/JobDescription";
import { getJob, loadJobs } from "@/lib/jobs";
import { formatNiche } from "@/lib/niches";
import { getSponsorshipForJob } from "@/lib/sponsorships";
import { formatUsd, getRequestTenant } from "@/lib/tenant";

export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return loadJobs("packaging").jobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") return { title: "Job not found" };
  const { id } = await params;
  const job = getJob(id, tenant.id);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company}`,
    description: `${job.title} — ${job.location}. Apply on the employer ATS.`,
  };
}

function formatPosted(postedAt: string | null) {
  if (!postedAt) return "Date not listed";
  const time = Date.parse(postedAt);
  if (Number.isNaN(time)) return postedAt;
  return new Date(time).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function JobPage({ params }: Params) {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const { id } = await params;
  const job = getJob(id, tenant.id);
  if (!job) notFound();

  const sponsorship = await getSponsorshipForJob(job.id, tenant.id);
  const niche = formatNiche(job.niche);
  const price = formatUsd(tenant.sponsor.priceCents);

  return (
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
        <a
          className="apply big"
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply on {job.company} careers
        </a>
        {!sponsorship ? (
          <Link className="ghost big" href={`/sponsor/${job.id}`}>
            Sponsor this listing — {price}
          </Link>
        ) : null}
      </div>
      <JobDescription text={job.description} />
      <div className="spec-actions">
        <a
          className="apply big"
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply on {job.company} careers
        </a>
      </div>
    </article>
  );
}
