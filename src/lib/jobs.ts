import { readFileSync } from "node:fs";
import path from "node:path";
import { getVertical } from "@config/tenants";
import type { NormalizedJob } from "../../ingest/types";

export type JobsFile = {
  ingestedAt: string | null;
  total: number;
  jobs: NormalizedJob[];
};

const emptyJobs: JobsFile = { ingestedAt: null, total: 0, jobs: [] };

export function loadJobs(verticalId = "packaging"): JobsFile {
  const tenant = getVertical(verticalId);
  const file = path.join(process.cwd(), tenant.dataFile);
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as JobsFile;
    return {
      ingestedAt: parsed.ingestedAt ?? null,
      total: parsed.jobs?.length ?? parsed.total ?? 0,
      jobs: parsed.jobs ?? [],
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return emptyJobs;
    throw error;
  }
}

export function getJob(
  id: string,
  verticalId = "packaging",
): NormalizedJob | undefined {
  return loadJobs(verticalId).jobs.find((job) => job.id === id);
}
