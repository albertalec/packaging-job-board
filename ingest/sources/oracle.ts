import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type OracleJob = {
  Id?: string;
  Title?: string;
  PrimaryLocation?: string;
  PostedDate?: string;
  ShortDescriptionStr?: string;
};

type OracleJobDetail = {
  ExternalDescriptionStr?: string;
  ShortDescriptionStr?: string;
  ExternalQualificationsStr?: string;
  ExternalResponsibilitiesStr?: string;
};

async function fetchOracleJobDetail(
  origin: string,
  site: string,
  id: string,
): Promise<OracleJobDetail | null> {
  const url = `${origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?finder=ById;Id=${encodeURIComponent(id)},siteNumber=${site}`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) return null;
  const payload = (await res.json()) as { items?: OracleJobDetail[] };
  return payload.items?.[0] ?? null;
}

function descriptionFromOracle(
  listCard: OracleJob,
  detail: OracleJobDetail | null,
): string {
  const parts = [
    detail?.ExternalDescriptionStr,
    detail?.ExternalResponsibilitiesStr,
    detail?.ExternalQualificationsStr,
    detail?.ShortDescriptionStr,
    listCard.ShortDescriptionStr,
    listCard.Title,
  ].filter((value): value is string => Boolean(value?.trim()));
  return stripHtml(parts.join("\n\n"));
}

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

export async function ingestOracle(company: Company): Promise<IngestResult> {
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
  const stats = new IngestStats();
  const jobs = [];
  for (const job of byId.values()) {
    const id = String(job.Id ?? job.Title);
    stats.recordScan(id);
    const applyUrl = `${origin}/hcmUI/CandidateExperience/en/sites/${site}/job/${id}`;
    const listDescription = stripHtml(job.ShortDescriptionStr ?? "");
    const detail =
      listDescription.length < 120
        ? await fetchOracleJobDetail(origin, site, id)
        : null;
    const normalized = toJob(company, {
      sourceId: id,
      title: job.Title ?? "",
      location: job.PrimaryLocation ?? "",
      postedAt: job.PostedDate ?? null,
      applyUrl,
      description: descriptionFromOracle(job, detail),
    }, stats);
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
