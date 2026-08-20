import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
import type { Company, NormalizedJob } from "../types.ts";

type PhenomJob = {
  jobId?: string;
  jobSeqNo?: string;
  reqId?: string;
  title?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  cityStateCountry?: string;
  postedDate?: string;
  applyUrl?: string;
  category?: string;
  descriptionTeaser?: string;
  ml_job_parser?: { descriptionTeaser?: string };
};

type PhenomPage = {
  refineSearch?: {
    totalHits?: number;
    data?: { jobs?: PhenomJob[] };
  };
};

function originFrom(url: string): string {
  return new URL(url).origin;
}

function locationOf(job: PhenomJob): string {
  if (job.cityStateCountry) return job.cityStateCountry;
  if (job.location) return job.location;
  return [job.city, job.state, job.country].filter(Boolean).join(", ");
}

function refNumFromHtml(html: string): string | null {
  const match = html.match(/"refNum"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? null;
}

async function openSite(careerUrl: string): Promise<{ origin: string; cookies: string; html: string }> {
  const res = await fetch(careerUrl, {
    headers: { ...BROWSER_HEADERS, Accept: "text/html,application/json" },
    redirect: "follow",
  });
  const cookies = res.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
  const html = await res.text();
  return { origin: new URL(res.url).origin, cookies, html };
}

export async function ingestPhenom(company: Company): Promise<NormalizedJob[]> {
  const opened = await openSite(company.careerUrl);
  const origin = originFrom(company.careerUrl);
  const refNum = company.refNum || refNumFromHtml(opened.html);
  if (!refNum) {
    throw new Error(`Phenom ${company.name}: refNum not found`);
  }

  const jobs: NormalizedJob[] = [];
  const seen = new Set<string>();
  const size = 50;

  for (const keywords of companySearchTexts(company)) {
    let from = 0;
    let total = Infinity;
    while (from < total && from < 400) {
      const res = await fetch(`${origin}/widgets`, {
        method: "POST",
        headers: {
          ...BROWSER_HEADERS,
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: opened.cookies,
          Referer: company.careerUrl,
          Origin: origin,
        },
        body: JSON.stringify({
          lang: "en_us",
          deviceType: "desktop",
          country: "us",
          pageName: "search-results",
          size,
          from,
          jobs: true,
          counts: true,
          all_fields: ["category", "country", "city", "type", "state"],
          clearAll: false,
          jdsource: "facets",
          isSliderEnable: false,
          pageId: "page20",
          siteType: "external",
          keywords,
          global: true,
          selected_fields: {},
          sort: { order: "desc", field: "postedDate" },
          locationData: {},
          refNum,
          ddoKey: "refineSearch",
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("json")) {
        throw new Error(`Phenom ${company.name} ${res.status} ${origin}/widgets`);
      }
      const page = (await res.json()) as PhenomPage;
      const postings = page.refineSearch?.data?.jobs ?? [];
      total = page.refineSearch?.totalHits ?? 0;
      for (const posting of postings) {
        const title = posting.title ?? "";
        const sourceId = String(
          posting.jobSeqNo || posting.jobId || posting.reqId || title,
        );
        if (seen.has(sourceId)) continue;
        const applyUrl =
          posting.applyUrl ||
          (posting.jobSeqNo
            ? `${origin}/us/en/job/${posting.jobSeqNo}`
            : company.careerUrl);
        const description =
          posting.descriptionTeaser ||
          posting.ml_job_parser?.descriptionTeaser ||
          title;
        const normalized = toJob(company, {
          sourceId,
          title,
          department: posting.category ?? null,
          location: locationOf(posting),
          postedAt: posting.postedDate ?? null,
          applyUrl,
          description,
        });
        if (normalized) {
          seen.add(sourceId);
          jobs.push(normalized);
        }
      }
      if (postings.length === 0) break;
      from += size;
    }
  }
  return jobs;
}
