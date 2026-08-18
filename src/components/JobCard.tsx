import Link from "next/link";
import type { NormalizedJob } from "../../ingest/types";

function postedLabel(postedAt: string | null): string | null {
  if (!postedAt) return null;
  const time = Date.parse(postedAt);
  if (Number.isNaN(time)) return postedAt;
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 1) return "Posted today";
  if (days < 14) return `${days}d ago`;
  return new Date(time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function JobCard({
  job,
  sponsored = false,
}: {
  job: NormalizedJob;
  sponsored?: boolean;
}) {
  const posted = postedLabel(job.postedAt);
  const fresh = posted === "Posted today" || (posted?.endsWith("d ago") && Number.parseInt(posted, 10) <= 3);

  return (
    <article className={`job-card${sponsored ? " job-card-sponsored" : ""}`}>
      <div className="job-card-top">
        <p className="company">{job.company}</p>
        {sponsored ? <span className="stamp sponsor-stamp">Sponsored</span> : null}
        {!sponsored && fresh ? <span className="stamp">New</span> : null}
      </div>
      <h2>
        <Link href={`/jobs/${job.id}`}>{job.title}</Link>
      </h2>
      <p className="meta">
        <span>{job.location}</span>
        {job.niche ? <span className="niche">{job.niche.replace("-", " / ")}</span> : null}
        {posted ? <span>{posted}</span> : null}
      </p>
      <div className="actions">
        <Link className="ghost" href={`/jobs/${job.id}`}>
          Spec sheet
        </Link>
        {!sponsored ? (
          <Link className="ghost sponsor-link" href={`/sponsor/${job.id}`}>
            Sponsor
          </Link>
        ) : null}
        <a
          className="apply"
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply on employer site
        </a>
      </div>
    </article>
  );
}
