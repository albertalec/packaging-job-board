import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

type PhenomJob = {
  jobId?: string;
  id?: string;
  title?: string;
  jobTitle?: string;
  location?: string;
  locations?: Array<string | { city?: string; state?: string; country?: string }>;
  city?: string;
  state?: string;
  postedDate?: string;
  postedOn?: string;
  datePosted?: string;
  url?: string;
  jobUrl?: string;
  applyUrl?: string;
  category?: string;
  department?: string;
  description?: string;
  jobDescription?: string;
};

function originFrom(url: string): string {
  return new URL(url).origin;
}

function flattenLocations(job: PhenomJob): string {
  if (typeof job.location === "string" && job.location) return job.location;
  if (job.city || job.state) return [job.city, job.state].filter(Boolean).join(", ");
  if (!job.locations?.length) return "";
  return job.locations
    .map((item) =>
      typeof item === "string"
        ? item
        : [item.city, item.state, item.country].filter(Boolean).join(", "),
    )
    .filter(Boolean)
    .join(" · ");
}

function pickJobs(payload: unknown): PhenomJob[] {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  for (const key of ["jobs", "jobList", "data", "items", "results"]) {
    const value = data[key];
    if (Array.isArray(value)) return value as PhenomJob[];
    if (value && typeof value === "object" && Array.isArray((value as { jobs?: unknown }).jobs)) {
      return (value as { jobs: PhenomJob[] }).jobs;
    }
  }
  return [];
}

async function tryJson(url: string): Promise<PhenomJob[] | null> {
  const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow" });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const jobs = pickJobs(JSON.parse(text));
    return jobs.length ? jobs : null;
  } catch {
    const embedded = text.match(/https?:\/\/[^"'\s]+(?:jobs-api|api\/jobs)[^"'\s]*/i);
    if (embedded) return tryJson(embedded[0]);
    const widget = text.match(/"jobSearchUrl"\s*:\s*"([^"]+)"/);
    if (widget) return tryJson(widget[1].replace(/\\u002F/g, "/"));
    return null;
  }
}

export async function ingestPhenom(company: Company): Promise<NormalizedJob[]> {
  const origin = originFrom(company.careerUrl);
  const query = encodeURIComponent(company.searchText ?? "packaging");
  const candidates = [
    `${origin}/api/jobs?page=1&limit=50&keywords=${query}&sortBy=relevancy`,
    `${origin}/api/jobs?keyword=${query}&page=1`,
    `${origin}/widgets/api/jobs?keyword=${query}`,
    `${origin}/en-us/search-jobs/results?Keywords=${query}&CurrentPage=1`,
    company.careerUrl,
  ];

  let raw: PhenomJob[] | null = null;
  let lastError = "no Phenom JSON endpoint responded";
  for (const url of candidates) {
    try {
      const found = await tryJson(url);
      if (found?.length) {
        raw = found;
        break;
      }
    } catch (error) {
      lastError = String(error);
    }
  }
  if (!raw) throw new Error(`Phenom ${company.name}: ${lastError}`);

  const jobs: NormalizedJob[] = [];
  for (const job of raw) {
    const title = job.title || job.jobTitle || "";
    const sourceId = job.jobId || job.id || title;
    const applyUrl =
      job.applyUrl ||
      job.jobUrl ||
      job.url ||
      `${origin}/jobs/${sourceId}`;
    const normalized = toJob(company, {
      sourceId: String(sourceId),
      title,
      department: job.department || job.category || null,
      location: flattenLocations(job),
      postedAt: job.postedDate || job.postedOn || job.datePosted || null,
      applyUrl,
      description: stripHtml(job.description || job.jobDescription || title),
    });
    if (normalized) jobs.push(normalized);
  }
  return jobs;
}
