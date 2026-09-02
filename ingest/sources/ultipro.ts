import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type UltiproAddress = {
  City?: string | null;
  PostalCode?: string | null;
  State?: { Code?: string | null; Name?: string | null } | null;
  Country?: { Code?: string | null; Name?: string | null } | null;
};

type UltiproLocation = {
  Address?: UltiproAddress | null;
  LocalizedDescription?: string | null;
};

type UltiproSearchHit = {
  Id?: string;
  Title?: string;
  RequisitionNumber?: string | null;
  JobCategoryName?: string | null;
  PostedDate?: string | null;
  BriefDescription?: string | null;
  Locations?: UltiproLocation[] | null;
};

type UltiproDetail = UltiproSearchHit & {
  Description?: string | null;
  CompensationAnnualMinimum?: number | null;
  CompensationAnnualMaximum?: number | null;
  CompensationAmount?: string | null;
};

function boardBase(careerUrl: string): string {
  const url = new URL(careerUrl);
  const match = url.pathname.match(
    /^(.*?\/JobBoard\/[0-9a-f-]{36})(?:\/|$)/i,
  );
  if (!match) {
    throw new Error(`Ultipro JobBoard URL missing for ${careerUrl}`);
  }
  return `${url.origin}${match[1]}`;
}

function formatLocation(locations: UltiproLocation[] | null | undefined): string {
  const loc = locations?.[0];
  const address = loc?.Address;
  if (!address) return loc?.LocalizedDescription?.trim() || "";
  const city = address.City?.trim() || "";
  const state = address.State?.Code?.trim() || address.State?.Name?.trim() || "";
  const country = address.Country?.Name?.trim() || address.Country?.Code?.trim() || "";
  const campus = loc?.LocalizedDescription?.trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  const base = [cityState, country].filter(Boolean).join(", ");
  if (campus && cityState && !base.toLowerCase().includes(campus.toLowerCase())) {
    return `${cityState} · ${campus}${country ? `, ${country}` : ""}`;
  }
  return base;
}

function salaryFromDetail(detail: UltiproDetail): string | null {
  const min = detail.CompensationAnnualMinimum;
  const max = detail.CompensationAnnualMaximum;
  if (min != null && max != null) return `$${min}–$${max}`;
  if (min != null) return `$${min}+`;
  if (typeof detail.CompensationAmount === "string" && detail.CompensationAmount.trim()) {
    return detail.CompensationAmount.trim();
  }
  return null;
}

async function searchBoard(
  base: string,
  query: string,
): Promise<UltiproSearchHit[]> {
  const res = await fetch(`${base}/JobBoardView/LoadSearchResults`, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      opportunitySearch: {
        Top: 50,
        Skip: 0,
        QueryString: query,
        OrderBy: [
          {
            Value: "postedDateDesc",
            PropertyName: "PostedDate",
            Ascending: false,
          },
        ],
        Filters: [
          {
            t: "TermsSearchFilterDto",
            fieldName: 4,
            extra: null,
            values: [],
          },
        ],
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ultipro search ${res.status}`);
  }
  const data = (await res.json()) as { opportunities?: UltiproSearchHit[] };
  return data.opportunities ?? [];
}

function parseEmbeddedDetail(html: string): UltiproDetail | null {
  const match = html.match(
    /new US\.Opportunity\.CandidateOpportunityDetail\((\{.*?\})\)\s*;/s,
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as UltiproDetail;
  } catch {
    return null;
  }
}

async function loadDetail(
  base: string,
  opportunityId: string,
): Promise<UltiproDetail | null> {
  const res = await fetch(
    `${base}/OpportunityDetail?opportunityId=${encodeURIComponent(opportunityId)}`,
    { headers: { ...BROWSER_HEADERS, Accept: "text/html" } },
  );
  if (!res.ok) return null;
  return parseEmbeddedDetail(await res.text());
}

export async function ingestUltipro(company: Company): Promise<IngestResult> {
  const base = boardBase(company.careerUrl);
  const byId = new Map<string, UltiproSearchHit>();
  for (const query of companySearchTexts(company)) {
    const hits = await searchBoard(base, query);
    for (const hit of hits) {
      if (!hit.Id || !hit.Title) continue;
      if (!byId.has(hit.Id)) byId.set(hit.Id, hit);
    }
  }

  const stats = new IngestStats();
  const jobs = [];
  for (const hit of byId.values()) {
    stats.recordScan(hit.Id!);
    const preview = toJob(company, {
      sourceId: hit.Id!,
      title: hit.Title!,
      department: hit.JobCategoryName ?? null,
      location: formatLocation(hit.Locations),
      postedAt: hit.PostedDate ?? null,
      applyUrl: `${base}/OpportunityDetail?opportunityId=${hit.Id}`,
      description: stripHtml(hit.BriefDescription ?? hit.Title ?? ""),
    }, stats);
    if (!preview) continue;

    const detail = (await loadDetail(base, hit.Id!)) ?? hit;
    const normalized = toJob(company, {
      sourceId: hit.Id!,
      title: detail.Title ?? hit.Title!,
      department: detail.JobCategoryName ?? hit.JobCategoryName ?? null,
      location: formatLocation(detail.Locations ?? hit.Locations),
      postedAt: detail.PostedDate ?? hit.PostedDate ?? null,
      applyUrl: `${base}/OpportunityDetail?opportunityId=${hit.Id}`,
      description: stripHtml(
        detail.Description ?? hit.BriefDescription ?? hit.Title ?? "",
      ),
      salary: salaryFromDetail(detail),
    }, stats);
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
