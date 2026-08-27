import type { NormalizedJob } from "../../../ingest/types";
import { loadJobs } from "../jobs";
import { postedTimestamp } from "../posted-at";

export type SocialJobContext = {
  title: string;
  company: string;
  url: string;
  id: string;
};

/** Pick the freshest on-board role not yet used in a social draft. */
export function pickFreshJob(input: {
  verticalId: string;
  origin: string;
  excludeJobIds?: string[];
  now?: number;
}): SocialJobContext | null {
  const { jobs } = loadJobs(input.verticalId);
  const exclude = new Set(input.excludeJobIds ?? []);
  const now = input.now ?? Date.now();
  const origin = input.origin.replace(/\/$/, "");

  const candidates = jobs
    .filter((job) => !exclude.has(job.id))
    .sort(
      (a, b) =>
        postedTimestamp(b.postedAt, now) - postedTimestamp(a.postedAt, now),
    );

  const job = candidates[0];
  if (!job) return null;

  return toSocialJobContext(job, origin);
}

export function toSocialJobContext(
  job: NormalizedJob,
  origin: string,
): SocialJobContext {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    url: `${origin.replace(/\/$/, "")}/jobs/${job.id}`,
  };
}

export function boardStats(verticalId: string): {
  totalJobs: number;
  ingestedAt: string | null;
} {
  const file = loadJobs(verticalId);
  return { totalJobs: file.total, ingestedAt: file.ingestedAt };
}
