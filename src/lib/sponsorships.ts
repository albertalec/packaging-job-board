import type { NormalizedJob } from "../../ingest/types";
import { promiseRank } from "./rank";
import { postedTimestamp } from "./seo";
import {
  getActiveSponsoredJobIds,
  getSponsorshipForJob,
  isActiveSponsorship,
  loadSponsorships,
  type Sponsorship,
} from "./sponsorship-store";

export type { Sponsorship };
export {
  getActiveSponsoredJobIds,
  getSponsorshipForJob,
  isActiveSponsorship,
  loadSponsorships,
};

/** Newer postings first. Unparseable dates sort last. */
export function compareJobsByRecency(
  left: NormalizedJob,
  right: NormalizedJob,
  now = Date.now(),
): number {
  return postedTimestamp(right.postedAt, now) - postedTimestamp(left.postedAt, now);
}

/** Sponsor picker: prefer core packaging titles, then recency. */
export function compareJobsByPromise(
  left: NormalizedJob,
  right: NormalizedJob,
): number {
  const rank = promiseRank(right.title) - promiseRank(left.title);
  if (rank !== 0) return rank;
  return compareJobsByRecency(left, right);
}

/** Board listing: pinned first, then most recent. */
export function sortJobsWithSponsors(
  jobs: NormalizedJob[],
  sponsoredIds: Set<string>,
  now = Date.now(),
): NormalizedJob[] {
  return [...jobs].sort((left, right) => {
    const leftSponsored = sponsoredIds.has(left.id) ? 1 : 0;
    const rightSponsored = sponsoredIds.has(right.id) ? 1 : 0;
    if (leftSponsored !== rightSponsored) return rightSponsored - leftSponsored;
    return compareJobsByRecency(left, right, now);
  });
}
