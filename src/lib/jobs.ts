import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getVertical } from "@config/tenants";
import type { NormalizedJob } from "../../ingest/types";

export type JobsFile = {
  ingestedAt: string | null;
  total: number;
  jobs: NormalizedJob[];
};

const emptyJobs: JobsFile = { ingestedAt: null, total: 0, jobs: [] };

/**
 * Resolve the jobs JSON for a vertical.
 * Path segments are literal so Next.js output file tracing can include the
 * file in Vercel serverless bundles (dynamic `tenant.dataFile` alone is missed).
 */
export function jobsDataPath(verticalId: string): string {
  return path.join(process.cwd(), "data", verticalId, "jobs.json");
}

function parseJobsFile(raw: string): JobsFile {
  const parsed = JSON.parse(raw) as JobsFile;
  return {
    ingestedAt: parsed.ingestedAt ?? null,
    total: parsed.jobs?.length ?? parsed.total ?? 0,
    jobs: parsed.jobs ?? [],
  };
}

export function loadJobs(verticalId = "packaging"): JobsFile {
  // Touch the vertical config so misconfigured tenants still fail loudly.
  getVertical(verticalId);

  const primary = jobsDataPath(verticalId);
  if (existsSync(primary)) {
    return parseJobsFile(readFileSync(primary, "utf8"));
  }

  // Legacy single-board path (pre multi-tenant) — keep for local checkouts.
  if (verticalId === "packaging") {
    const legacy = path.join(process.cwd(), "data", "jobs.json");
    if (existsSync(legacy)) {
      return parseJobsFile(readFileSync(legacy, "utf8"));
    }
  }

  return emptyJobs;
}

export function getJob(
  id: string,
  verticalId = "packaging",
): NormalizedJob | undefined {
  return loadJobs(verticalId).jobs.find((job) => job.id === id);
}
