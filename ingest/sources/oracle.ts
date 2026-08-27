import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
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
  const byId = new Map<string, OracleJob>();
  for (const searchText of companySearchTexts(company)) {
    const query = encodeURIComponent(searchText || "packaging");
    const urls = [
      `${origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&limit=50&expand=requisitionList&finder=findReqs;siteNumber=${site},limit=50,offset=0,keyword=${query}`,
      `${origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&limit=50&finder=findReqs;siteNumber=${site},limit=50,offset=0,keyword=${query}`,
    ];
    for (const url of urls) {
      const res = await fetch(url, { headers: BROWSER_HEADERS });
      if (!res.ok) continue;
      const batch = collectJobs(await res.json()).filter((job) => job.Title);
      for (const job of batch) {
        const id = String(job.Id ?? job.Title);
        if (!byId.has(id)) byId.set(id, job);
      }
      if (batch.length) break;
    }
  }
  if (!byId.size) {
    throw new Error(`Oracle recruiting JSON not available for ${company.name}`);
  }
  const jobs: NormalizedJob[] = [];
  for (const job of byId.values()) {
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
