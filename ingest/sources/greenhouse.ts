import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  content?: string;
  metadata?: Array<{
    name?: string;
    value?: unknown;
    value_type?: string;
  }>;
};

function salaryFromMetadata(job: GreenhouseJob): string | null {
  const pay = job.metadata?.find((item) =>
    /pay|salary|compensation/i.test(item.name ?? ""),
  );
  if (!pay?.value) return null;
  if (typeof pay.value === "string") return pay.value;
  if (
    typeof pay.value === "object" &&
    pay.value &&
    "min_value" in pay.value &&
    "max_value" in pay.value
  ) {
    const range = pay.value as { min_value?: string; max_value?: string; unit?: string };
    return `${range.min_value ?? ""}–${range.max_value ?? ""} ${range.unit ?? ""}`.trim();
  }
  return null;
}

export async function ingestGreenhouse(company: Company): Promise<IngestResult> {
  const token = company.boardToken;
  if (!token) throw new Error(`Greenhouse board token missing for ${company.name}`);
  const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`Greenhouse ${company.name} ${res.status}`);
  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const stats = new IngestStats();
  const jobs = [];
  for (const job of data.jobs ?? []) {
    const sourceId = String(job.id);
    stats.recordScan(sourceId);
    const description = stripHtml(job.content ?? "");
    const normalized = toJob(company, {
      sourceId,
      title: job.title,
      department: job.departments?.[0]?.name ?? null,
      location: job.location?.name ?? "",
      postedAt: job.first_published ?? job.updated_at ?? null,
      applyUrl: job.absolute_url,
      description,
      salary: salaryFromMetadata(job),
    }, stats);
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
