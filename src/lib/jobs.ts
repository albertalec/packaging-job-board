import { readFileSync } from "node:fs";
import path from "node:path";
import type { NormalizedJob } from "../../ingest/types";

export type JobsFile = {
  ingestedAt: string | null;
  total: number;
  jobs: NormalizedJob[];
};

export function loadJobs(): JobsFile {
  const file = path.join(process.cwd(), "data", "jobs.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as JobsFile;
  return parsed;
}

export function getJob(id: string): NormalizedJob | undefined {
  return loadJobs().jobs.find((job) => job.id === id);
}
