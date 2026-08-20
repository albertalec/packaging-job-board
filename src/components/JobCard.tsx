import Link from "next/link";
import type { NormalizedJob } from "../../ingest/types";
import { ApplyLink } from "@/components/ApplyLink";
import { formatNiche } from "@/lib/niches";

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
  compact = false,
}: {
  job: NormalizedJob;
  sponsored?: boolean;
  compact?: boolean;
}) {
  const posted = postedLabel(job.postedAt);
  const fresh =
    posted === "Posted today" ||
    (posted?.endsWith("d ago") && Number.parseInt(posted, 10) <= 3);
  const niche = formatNiche(job.niche);

  return (
    <article
      className={`job-card${sponsored ? " job-card-sponsored" : ""}${compact ? " job-card-preview" : ""}`}
    >
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
        {niche ? <span className="niche">{niche}</span> : null}
        {posted ? <span>{posted}</span> : null}
      </p>
      {compact ? null : (
        <div className="actions">
          <ApplyLink className="apply" href={job.applyUrl} company={job.company}>
            Apply on employer site
          </ApplyLink>
        </div>
      )}
    </article>
  );
}
