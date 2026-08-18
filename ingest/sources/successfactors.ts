import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

type SfJob = {
  id?: string;
  title?: string;
  location?: string;
  postedDate?: string;
  url?: string;
  description?: string;
};

function pickJobs(payload: unknown): SfJob[] {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  for (const key of ["jobs", "jobSearchResults", "requisitionList", "data"]) {
    const value = data[key];
    if (Array.isArray(value)) return value as SfJob[];
  }
  return [];
}

export async function ingestSuccessFactors(
  company: Company,
): Promise<NormalizedJob[]> {
  const query = encodeURIComponent(company.searchText ?? "packaging");
  const origin = new URL(company.careerUrl).origin;
  const urls = [
    `${origin}/search-jobs/results?Keywords=${query}`,
    `${company.careerUrl.replace(/\/$/, "")}/search-jobs/results?Keywords=${query}`,
  ];
  let raw: SfJob[] = [];
  for (const url of urls) {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) continue;
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("json")) {
      raw = pickJobs(await res.json());
      if (raw.length) break;
    }
  }
  if (!raw.length) {
    throw new Error(
      `SuccessFactors public JSON not available for ${company.name}`,
    );
  }
  const jobs: NormalizedJob[] = [];
  for (const job of raw) {
    const normalized = toJob(company, {
      sourceId: job.id || job.title || "",
      title: job.title ?? "",
      location: job.location ?? "",
      postedAt: job.postedDate ?? null,
      applyUrl: job.url || company.careerUrl,
      description: stripHtml(job.description ?? job.title ?? ""),
    });
    if (normalized) jobs.push(normalized);
  }
  return jobs;
}
