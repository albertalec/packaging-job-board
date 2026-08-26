import type { NormalizedJob } from "../../ingest/types";
import { postedTimestamp } from "./posted-at";
import { promiseRank } from "./rank";

export type BoardSortMode = "date" | "promise";

/** Newer postings first. Unparseable dates sort last. */
export function compareJobsByRecency(
  left: NormalizedJob,
  right: NormalizedJob,
  now = Date.now(),
): number {
  return postedTimestamp(right.postedAt, now) - postedTimestamp(left.postedAt, now);
}

/** Prefer core packaging titles, then recency. */
export function compareJobsByPromise(
  left: NormalizedJob,
  right: NormalizedJob,
  now = Date.now(),
): number {
  const rank = promiseRank(right.title) - promiseRank(left.title);
  if (rank !== 0) return rank;
  return compareJobsByRecency(left, right, now);
}

/** Board listing: pinned first, then date or promise rank. */
export function sortJobsWithSponsors(
  jobs: NormalizedJob[],
  sponsoredIds: Set<string>,
  now = Date.now(),
  mode: BoardSortMode = "date",
): NormalizedJob[] {
  return [...jobs].sort((left, right) => {
    const leftSponsored = sponsoredIds.has(left.id) ? 1 : 0;
    const rightSponsored = sponsoredIds.has(right.id) ? 1 : 0;
    if (leftSponsored !== rightSponsored) return rightSponsored - leftSponsored;
    return mode === "promise"
      ? compareJobsByPromise(left, right, now)
      : compareJobsByRecency(left, right, now);
  });
}
