import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type AmazonJob = {
  id_icims?: string;
  id?: string;
  title?: string;
  location?: string;
  normalized_location?: string;
  posted_date?: string;
  job_path?: string;
  description?: string;
  job_category?: string;
  job_family?: string;
};

function parsePosted(value?: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
}

export async function ingestAmazon(company: Company): Promise<IngestResult> {
  const query = encodeURIComponent(company.searchText ?? "packaging engineer");
  const country = company.country ? `&country=${company.country}` : "";
  const stats = new IngestStats();
  const jobs = [];
  const pageSize = 20;
  let offset = 0;
  let hits = Infinity;

  while (offset < hits && offset < 200) {
    const url = `https://www.amazon.jobs/en/search.json?base_query=${query}&offset=${offset}&result_limit=${pageSize}&sort=recent${country}`;
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`Amazon ${res.status}`);
    const data = (await res.json()) as { hits?: number; jobs?: AmazonJob[] };
    hits = data.hits ?? 0;
    for (const job of data.jobs ?? []) {
      const sourceId = String(job.id_icims || job.id || job.title || "");
      stats.recordScan(sourceId);
      const path = job.job_path ?? "";
      const applyUrl = path.startsWith("http")
        ? path
        : `https://www.amazon.jobs${path}`;
      const normalized = toJob(company, {
        sourceId,
        title: job.title ?? "",
        department: job.job_family || job.job_category || null,
        location: job.normalized_location || job.location || "",
        postedAt: parsePosted(job.posted_date),
        applyUrl,
        description: stripHtml(job.description ?? ""),
      }, stats);
      if (normalized) jobs.push(normalized);
    }
    if (!(data.jobs ?? []).length) break;
    offset += pageSize;
  }
  return { jobs, stats: stats.summary() };
}
