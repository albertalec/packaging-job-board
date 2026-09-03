import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type SearchHit = {
  path: string;
  jobId: string;
  title: string;
};

type JobPostingLd = {
  "@type"?: string;
  title?: string;
  description?: string;
  datePosted?: string;
  jobLocation?:
    | {
        name?: string;
        address?: {
          addressLocality?: string;
          addressRegion?: string;
          addressCountry?: string;
        };
      }
    | Array<{
        name?: string;
        address?: {
          addressLocality?: string;
          addressRegion?: string;
          addressCountry?: string;
        };
      }>;
};

const MAX_PAGES_PER_QUERY = 2;
const MAX_DETAIL_FETCHES = 120;

function orgIdFrom(company: Company): string {
  if (company.orgId) return company.orgId;
  throw new Error(`TalentBrew orgId required for ${company.name}`);
}

function parseTotalPages(html: string): number {
  const match = html.match(/data-total-pages="(\d+)"/);
  return match ? Number.parseInt(match[1], 10) : 1;
}

function parseSearchHits(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const blockRe =
    /<a href="(\/job\/[^"]+)"[^>]*data-job-id="(\d+)"[\s\S]*?<h2>([^<]+)<\/h2>/g;
  for (const match of html.matchAll(blockRe)) {
    hits.push({
      path: match[1],
      jobId: match[2],
      title: match[3].trim(),
    });
  }
  return hits;
}

function parseJobPostingLd(html: string): JobPostingLd | null {
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      const parsed = JSON.parse(match[1]) as JobPostingLd | JobPostingLd[];
      const postings = Array.isArray(parsed) ? parsed : [parsed];
      const job = postings.find((entry) => entry["@type"] === "JobPosting");
      if (job) return job;
    } catch {
      continue;
    }
  }
  return null;
}

function locationFromPosting(posting: JobPostingLd, fallbackPath: string): string {
  const rawLocation = posting.jobLocation;
  const locations = Array.isArray(rawLocation)
    ? rawLocation
    : rawLocation
      ? [rawLocation]
      : [];
  for (const place of locations) {
    const address = place.address;
    if (!address) continue;
    const city = address.addressLocality?.trim() || "";
    const state = address.addressRegion?.trim() || "";
    const country = address.addressCountry?.trim() || "";
    const cityState = [city, state].filter(Boolean).join(", ");
    if (cityState && country) return `${cityState}, ${country}`;
    if (cityState) return `${cityState}, United States`;
    if (state && country) return `${state}, ${country}`;
    if (state) return `${state}, United States`;
  }
  if (!Array.isArray(rawLocation) && rawLocation?.name?.trim()) {
    return rawLocation.name.trim();
  }
  const slug = fallbackPath.split("/")[2]?.replace(/-/g, " ") ?? "";
  return slug;
}

async function fetchSearchPage(
  origin: string,
  orgId: string,
  keyword: string,
  page: number,
): Promise<string> {
  const path = `/search-jobs/${encodeURIComponent(keyword)}/${orgId}/${page}`;
  const res = await fetch(`${origin}${path}`, {
    headers: { ...BROWSER_HEADERS, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`TalentBrew search ${res.status} ${path}`);
  }
  return res.text();
}

async function fetchJobPosting(
  origin: string,
  path: string,
): Promise<JobPostingLd | null> {
  const res = await fetch(`${origin}${path}`, {
    headers: { ...BROWSER_HEADERS, Accept: "text/html" },
  });
  if (!res.ok) return null;
  return parseJobPostingLd(await res.text());
}

export async function ingestTalentBrew(company: Company): Promise<IngestResult> {
  const origin = new URL(company.careerUrl).origin;
  const orgId = orgIdFrom(company);
  const stats = new IngestStats();
  const jobs = [];
  const seen = new Set<string>();
  let detailFetches = 0;

  for (const keyword of companySearchTexts(company)) {
    const firstHtml = await fetchSearchPage(origin, orgId, keyword, 1);
    const totalPages = Math.min(parseTotalPages(firstHtml), MAX_PAGES_PER_QUERY);
    const pages = [firstHtml];
    for (let page = 2; page <= totalPages; page += 1) {
      pages.push(await fetchSearchPage(origin, orgId, keyword, page));
    }

    for (const html of pages) {
      for (const hit of parseSearchHits(html)) {
        if (seen.has(hit.jobId)) continue;
        seen.add(hit.jobId);
        stats.recordScan(hit.jobId);
        if (detailFetches >= MAX_DETAIL_FETCHES) continue;
        detailFetches += 1;

        const posting = await fetchJobPosting(origin, hit.path);
        const title = posting?.title?.trim() || hit.title;
        const description = stripHtml(posting?.description ?? title);
        const normalized = toJob(
          company,
          {
            sourceId: hit.jobId,
            title,
            location: posting
              ? locationFromPosting(posting, hit.path)
              : hit.path.split("/")[2]?.replace(/-/g, " ") ?? "",
            postedAt: posting?.datePosted ?? null,
            applyUrl: `${origin}${hit.path}`,
            description,
          },
          stats,
        );
        if (normalized) jobs.push(normalized);
      }
    }
  }

  return { jobs, stats: stats.summary() };
}
