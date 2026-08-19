import type { NormalizedJob } from "../../ingest/types";
import { promiseRank } from "./rank";
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

export function compareJobsByPromise(
  left: NormalizedJob,
  right: NormalizedJob,
): number {
  const rank = promiseRank(right.title) - promiseRank(left.title);
  if (rank !== 0) return rank;
  const leftPosted = left.postedAt ? Date.parse(left.postedAt) : 0;
  const rightPosted = right.postedAt ? Date.parse(right.postedAt) : 0;
  return rightPosted - leftPosted;
}

export function sortJobsWithSponsors(
  jobs: NormalizedJob[],
  sponsoredIds: Set<string>,
): NormalizedJob[] {
  return [...jobs].sort((left, right) => {
    const leftSponsored = sponsoredIds.has(left.id) ? 1 : 0;
    const rightSponsored = sponsoredIds.has(right.id) ? 1 : 0;
    if (leftSponsored !== rightSponsored) return rightSponsored - leftSponsored;
    return compareJobsByPromise(left, right);
  });
}
