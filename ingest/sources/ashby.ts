import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type AshbyJob = {
  id?: string;
  title?: string;
  departmentName?: string;
  locationName?: string;
  isRemote?: boolean;
  publishedAt?: string;
  employmentType?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
  compensation?: { compensationTierSummary?: string };
};

export async function ingestAshby(company: Company): Promise<IngestResult> {
  const token = company.boardToken;
  if (!token) throw new Error(`Ashby board token missing for ${company.name}`);
  const url = `https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`Ashby ${company.name} ${res.status}`);
  const data = (await res.json()) as { jobs?: AshbyJob[] };
  const stats = new IngestStats();
  const jobs = [];
  for (const job of data.jobs ?? []) {
    const sourceId = job.id ?? job.title ?? "";
    stats.recordScan(sourceId);
    const description = stripHtml(job.descriptionHtml ?? "");
    const location = job.isRemote
      ? `${job.locationName ?? "Remote"} (Remote)`
      : (job.locationName ?? "");
    const normalized = toJob(company, {
      sourceId,
      title: job.title ?? "",
      department: job.departmentName ?? null,
      location,
      postedAt: job.publishedAt ?? null,
      applyUrl: job.applyUrl || job.jobUrl || company.careerUrl,
      description,
      salary: job.compensation?.compensationTierSummary ?? null,
    }, stats);
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
