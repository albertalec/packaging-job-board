import { BROWSER_HEADERS, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type JibeJob = {
  slug?: string;
  req_id?: string;
  title?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  full_location?: string;
  short_location?: string;
  posted_date?: string;
  apply_url?: string;
  category?: string;
};

type JibePage = {
  jobs?: Array<{ data?: JibeJob }>;
  count?: number;
  totalCount?: number;
};

function unwrap(page: JibePage): JibeJob[] {
  return (page.jobs ?? [])
    .map((item) => item.data)
    .filter((job): job is JibeJob => Boolean(job?.title));
}

function locationOf(job: JibeJob): string {
  if (job.full_location) return job.full_location;
  return [job.city, job.state, job.country].filter(Boolean).join(", ");
}

export async function ingestJibe(company: Company): Promise<IngestResult> {
  const origin = new URL(company.careerUrl).origin;
  const query = encodeURIComponent(company.searchText ?? "packaging");
  const url = `${origin}/api/jobs?keywords=${query}`;
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Jibe ${company.name} ${res.status} ${url}`);
  const page = (await res.json()) as JibePage;
  const stats = new IngestStats();
  const jobs = [];
  for (const posting of unwrap(page)) {
    const sourceId = String(posting.req_id || posting.slug || posting.title || "");
    stats.recordScan(sourceId);
    const applyUrl = posting.slug
      ? `${origin}/main/jobs/${posting.slug}`
      : posting.apply_url || company.careerUrl;
    const normalized = toJob(company, {
      sourceId,
      title: posting.title ?? "",
      department: posting.category ?? null,
      location: locationOf(posting),
      postedAt: posting.posted_date ?? null,
      applyUrl,
      description: posting.description || posting.title || "",
    }, stats);
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
