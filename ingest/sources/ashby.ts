import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

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

export async function ingestAshby(company: Company): Promise<NormalizedJob[]> {
  const token = company.boardToken;
  if (!token) throw new Error(`Ashby board token missing for ${company.name}`);
  const url = `https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`Ashby ${company.name} ${res.status}`);
  const data = (await res.json()) as { jobs?: AshbyJob[] };
  const jobs: NormalizedJob[] = [];
  for (const job of data.jobs ?? []) {
    const description = stripHtml(job.descriptionHtml ?? "");
    const location = job.isRemote
      ? `${job.locationName ?? "Remote"} (Remote)`
      : (job.locationName ?? "");
    const normalized = toJob(company, {
      sourceId: job.id ?? job.title ?? "",
      title: job.title ?? "",
      department: job.departmentName ?? null,
      location,
      postedAt: job.publishedAt ?? null,
      applyUrl: job.applyUrl || job.jobUrl || company.careerUrl,
      description,
      salary: job.compensation?.compensationTierSummary ?? null,
    });
    if (normalized) jobs.push(normalized);
  }
  return jobs;
}
