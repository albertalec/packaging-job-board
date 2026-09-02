import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type LeverJob = {
  id: string;
  text?: string;
  hostedUrl?: string;
  createdAt?: number;
  categories?: { location?: string; team?: string };
  descriptionPlain?: string;
  description?: string;
};

export async function ingestLever(company: Company): Promise<IngestResult> {
  const token = company.boardToken;
  if (!token) throw new Error(`Lever board token missing for ${company.name}`);
  const url = `https://api.lever.co/v0/postings/${token}?mode=json`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`Lever ${company.name} ${res.status}`);
  const postings = (await res.json()) as LeverJob[];
  const stats = new IngestStats();
  const jobs = [];
  for (const job of postings) {
    stats.recordScan(job.id);
    const description = job.descriptionPlain || stripHtml(job.description ?? "");
    const normalized = toJob(company, {
      sourceId: job.id,
      title: job.text ?? "",
      department: job.categories?.team ?? null,
      location: job.categories?.location ?? "",
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      applyUrl: job.hostedUrl ?? company.careerUrl,
      description,
    }, stats);
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
