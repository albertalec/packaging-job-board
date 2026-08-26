import Link from "next/link";
import type { NormalizedJob } from "../../ingest/types";
import { ApplyLink } from "@/components/ApplyLink";
import { formatNiche } from "@/lib/niches";

export type ListingRail = "pinned" | "new" | "default";

export function postedLabel(postedAt: string | null): string | null {
  if (!postedAt) return null;
  const time = Date.parse(postedAt);
  if (Number.isNaN(time)) {
    const relative = postedAt.match(/posted\s+(\d+)\+?\s*days?\s+ago/i);
    if (relative) return `${relative[1]}d ago`;
    if (/posted\s+today/i.test(postedAt)) return "1d ago";
    return postedAt;
  }
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return "30d+";
}

export function listingRail(
  postedAt: string | null,
  sponsored: boolean,
): ListingRail {
  if (sponsored) return "pinned";
  const posted = postedLabel(postedAt);
  const fresh =
    posted === "1d ago" ||
    posted === "2d ago" ||
    (posted?.endsWith("d ago") && Number.parseInt(posted, 10) <= 3);
  return fresh ? "new" : "default";
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
  const rail = listingRail(job.postedAt, sponsored);
  const niche = formatNiche(job.niche);
  const cardClass =
    rail === "pinned"
      ? "job-card job-card-pinned"
      : rail === "new"
        ? "job-card job-card-new"
        : "job-card";

  return (
    <article className={`${cardClass}${compact ? " job-card-preview" : ""}`}>
      <div className="job-card-main">
        <div className="job-card-top">
          <p className="company">{job.company}</p>
          {rail === "new" ? <span className="job-tag job-tag-new">New</span> : null}
          {sponsored ? <span className="job-tag job-tag-pinned">Pinned</span> : null}
        </div>
        <h2>
          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
        </h2>
        <p className="meta">
          <span>
            {job.location}
            {niche ? ` · ${niche}` : ""}
          </span>
        </p>
      </div>
      {compact ? null : (
        <div className="job-card-side">
          {posted ? <span className="job-age">{posted}</span> : null}
          <ApplyLink className="job-apply" href={job.applyUrl} company={job.company}>
            Apply on employer site →
          </ApplyLink>
        </div>
      )}
    </article>
  );
}
