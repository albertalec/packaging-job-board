import type { NormalizedJob } from "../../ingest/types";
import { postedTimestamp } from "./posted-at";
import { promiseRankForVertical } from "./rank";

export type BoardSortMode = "date" | "promise";

/** Newer postings first. Unparseable dates sort last. */
export function compareJobsByRecency(
  left: NormalizedJob,
  right: NormalizedJob,
  now = Date.now(),
): number {
  return postedTimestamp(right.postedAt, now) - postedTimestamp(left.postedAt, now);
}

/** Prefer on-wedge titles for the vertical, then recency. */
export function compareJobsByPromise(
  left: NormalizedJob,
  right: NormalizedJob,
  now = Date.now(),
  verticalId = "packaging",
): number {
  const rank =
    promiseRankForVertical(right.title, verticalId) -
    promiseRankForVertical(left.title, verticalId);
  if (rank !== 0) return rank;
  return compareJobsByRecency(left, right, now);
}

/** Board listing: pinned first, then date or promise rank. */
export function sortJobsWithSponsors(
  jobs: NormalizedJob[],
  sponsoredIds: Set<string> | Iterable<string>,
  now = Date.now(),
  mode: BoardSortMode = "date",
  verticalId = "packaging",
): NormalizedJob[] {
  const sponsored = sponsoredIds instanceof Set ? sponsoredIds : new Set(sponsoredIds);
  return [...jobs].sort((left, right) => {
    const leftSponsored = sponsored.has(left.id) ? 1 : 0;
    const rightSponsored = sponsored.has(right.id) ? 1 : 0;
    if (leftSponsored !== rightSponsored) return rightSponsored - leftSponsored;
    return mode === "promise"
      ? compareJobsByPromise(left, right, now, verticalId)
      : compareJobsByRecency(left, right, now);
  });
}
