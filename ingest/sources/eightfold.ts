import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type EightfoldPosition = {
  id?: number;
  displayJobId?: string;
  name?: string;
  locations?: string[];
  standardizedLocations?: string[];
  postedTs?: number;
  department?: string;
  positionUrl?: string;
};

type EightfoldSearchPage = {
  data?: {
    count?: number;
    positions?: EightfoldPosition[];
  };
};

type EightfoldDetail = {
  data?: {
    jobDescription?: string;
  };
};

function originFrom(careerUrl: string): string {
  return new URL(careerUrl).origin;
}

function domainFor(company: Company): string {
  if (company.boardToken) return company.boardToken;
  throw new Error(`Eightfold domain missing for ${company.name}`);
}

function formatLocation(position: EightfoldPosition): string {
  const standardized = position.standardizedLocations?.filter(Boolean) ?? [];
  if (standardized.length > 0) return standardized.join("; ");
  return (position.locations ?? []).filter(Boolean).join("; ");
}

function postedAtFrom(ts?: number): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

async function fetchDetail(
  origin: string,
  domain: string,
  positionId: number,
): Promise<string> {
  const url = `${origin}/api/pcsx/position_details?domain=${encodeURIComponent(domain)}&position_id=${positionId}`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) return "";
  const detail = (await res.json()) as EightfoldDetail;
  return detail.data?.jobDescription ?? "";
}

export async function ingestEightfold(company: Company): Promise<IngestResult> {
  const origin = originFrom(company.careerUrl);
  const domain = domainFor(company);
  const stats = new IngestStats();
  const jobs = [];
  const seen = new Set<string>();
  const pageSize = 10;

  for (const query of companySearchTexts(company)) {
    let start = 0;
    let total = Infinity;
    while (start < total && start < 400) {
      const url =
        `${origin}/api/pcsx/search?domain=${encodeURIComponent(domain)}` +
        `&start=${start}&num=${pageSize}&query=${encodeURIComponent(query)}&location=`;
      const res = await fetch(url, { headers: BROWSER_HEADERS });
      if (!res.ok) {
        throw new Error(`Eightfold ${company.name} ${res.status} ${url}`);
      }
      const page = (await res.json()) as EightfoldSearchPage;
      total = page.data?.count ?? 0;
      const positions = page.data?.positions ?? [];
      for (const position of positions) {
        const sourceId = String(position.id ?? position.displayJobId ?? "");
        const title = position.name?.trim() ?? "";
        if (!sourceId || !title || seen.has(sourceId)) continue;
        const path = position.positionUrl ?? `/careers/job/${sourceId}`;
        const applyUrl = path.startsWith("http") ? path : `${origin}${path}`;
        const location = formatLocation(position);
        stats.recordScan(sourceId);
        const preview = toJob(
          company,
          {
            sourceId,
            title,
            department: position.department ?? null,
            location,
            postedAt: postedAtFrom(position.postedTs),
            applyUrl,
            description: title,
          },
          stats,
        );
        if (!preview) continue;
        seen.add(sourceId);
        const description = position.id
          ? await fetchDetail(origin, domain, position.id)
          : "";
        const normalized = toJob(
          company,
          {
            sourceId,
            title,
            department: position.department ?? null,
            location,
            postedAt: postedAtFrom(position.postedTs),
            applyUrl,
            description: stripHtml(description) || title,
          },
          stats,
        );
        if (normalized) jobs.push(normalized);
      }
      if (positions.length === 0) break;
      start += pageSize;
    }
  }
  return { jobs, stats: stats.summary() };
}
