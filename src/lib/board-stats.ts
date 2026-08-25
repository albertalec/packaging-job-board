import type { NormalizedJob } from "../../ingest/types";

/** Packaging in-joke: ECT rating scales with inventory (44 at ~51 roles). */
export function boardEctRating(roleCount: number): number {
  if (roleCount <= 0) return 32;
  return Math.max(32, Math.min(80, Math.round(roleCount * 0.862)));
}

export function countSectors(jobs: NormalizedJob[]): number {
  return new Set(jobs.map((job) => job.niche).filter(Boolean)).size;
}

/** Top employers for hero lede — “A, B, C and N others”. */
export function employerLede(jobs: NormalizedJob[]): string {
  const companies = [...new Set(jobs.map((job) => job.company))];
  if (companies.length === 0) {
    return "Open roles at brand employers. Pulled daily from employer ATS feeds. You apply on the company's career site.";
  }

  const top = companies.slice(0, 4);
  const others = companies.length - top.length;
  const lead = top.join(", ");

  if (others <= 0) {
    return `Open roles at ${lead}. Pulled daily from employer ATS feeds. You apply on the company's career site.`;
  }

  const othersLabel = others === 1 ? "one other" : `${others} others`;
  return `Open roles at ${lead} and ${othersLabel}. Pulled daily from employer ATS feeds. You apply on the company's career site.`;
}
