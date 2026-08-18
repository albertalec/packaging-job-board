import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, loadJobs } from "@/lib/jobs";

export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return loadJobs().jobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company}`,
    description: `${job.title} — ${job.location}. Apply on the employer ATS.`,
  };
}

function toParagraphs(description: string): string[] {
  return description
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#xa;/gi, "\n")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
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
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();

  return (
    <article className="spec">
      <p className="kicker">
        <Link href="/">All jobs</Link> / {job.company}
      </p>
      <h1>{job.title}</h1>
      <ul className="spec-meta">
        <li>{job.company}</li>
        <li>{job.location}</li>
        <li>Posted {formatPosted(job.postedAt)}</li>
        {job.niche ? <li>{job.niche.replace("-", " / ")}</li> : null}
        {job.salary ? <li>{job.salary}</li> : null}
      </ul>
      <a className="apply big" href={job.applyUrl} rel="noreferrer">
        Apply on {job.company} careers
      </a>
      <div className="description">
        {toParagraphs(job.description).map((paragraph, index) => (
          <p key={`${job.id}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
