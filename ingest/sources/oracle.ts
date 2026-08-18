import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

type OracleJob = {
  Id?: string;
  Title?: string;
  PrimaryLocation?: string;
  PostedDate?: string;
  ShortDescriptionStr?: string;
};

function collectJobs(value: unknown, found: OracleJob[] = []): OracleJob[] {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    for (const item of value) collectJobs(item, found);
    return found;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.Title === "string" && (record.Id || record.RequisitionId)) {
    found.push(record as OracleJob);
  }
  for (const nested of Object.values(record)) collectJobs(nested, found);
  return found;
}

export async function ingestOracle(company: Company): Promise<NormalizedJob[]> {
  const origin = new URL(company.careerUrl).origin;
  const site = company.site ?? "CX_1";
  const query = encodeURIComponent(company.searchText ?? "packaging");
  const urls = [
    `${origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&limit=50&expand=requisitionList&finder=findReqs;siteNumber=${site},limit=50,offset=0,keyword=${query}`,
    `${origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&limit=50&finder=findReqs;siteNumber=${site},limit=50,offset=0,keyword=${query}`,
  ];
  let raw: OracleJob[] = [];
  for (const url of urls) {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) continue;
    raw = collectJobs(await res.json()).filter((job) => job.Title);
    if (raw.length) break;
  }
  if (!raw.length) {
    throw new Error(`Oracle recruiting JSON not available for ${company.name}`);
  }
  const jobs: NormalizedJob[] = [];
  for (const job of raw) {
    const id = String(job.Id ?? job.Title);
    const applyUrl = `${origin}/hcmUI/CandidateExperience/en/sites/${site}/job/${id}`;
    const normalized = toJob(company, {
      sourceId: id,
      title: job.Title ?? "",
      location: job.PrimaryLocation ?? "",
      postedAt: job.PostedDate ?? null,
      applyUrl,
      description: stripHtml(job.ShortDescriptionStr ?? job.Title ?? ""),
    });
    if (normalized) jobs.push(normalized);
  }
  return jobs;
}
