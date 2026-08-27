import { BROWSER_HEADERS, toJob } from "../classify.ts";
import { enrichLocationWithCityState } from "../location.ts";
import { companySearchTexts } from "../search.ts";
import type { Company, NormalizedJob } from "../types.ts";

type WorkdayJob = {
  title?: string;
  locationsText?: string;
  postedOn?: string;
  externalPath?: string;
};

type WorkdayPage = {
  total?: number;
  jobPostings?: WorkdayJob[];
};

type WorkdayDetail = {
  jobPostingInfo?: {
    jobDescription?: string;
    title?: string;
    location?: string;
    postedOn?: string;
    hiringOrganization?: string;
    country?: { descriptor?: string; alpha2Code?: string };
    jobRequisitionLocation?: {
      descriptor?: string;
      country?: { descriptor?: string; alpha2Code?: string };
    };
  };
};

type Board = { host: string; tenant: string; site: string };

function boardFromUrl(careerUrl: string): Board | null {
  const match = careerUrl.match(
    /^https:\/\/([^/]*myworkdayjobs\.com)\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?([^/?#]+)/,
  );
  if (!match) return null;
  return { host: match[1], tenant: match[1].split(".")[0], site: match[2] };
}

function boardFromHtml(html: string, host: string): Board | null {
  const match = html.match(/\/wday\/cxs\/([^/"'\s]+)\/([^/"'\s]+)/);
  if (!match) return null;
  return { host, tenant: match[1], site: match[2] };
}

async function openBoard(url: string): Promise<{ board: Board | null; cookies: string }> {
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, Accept: "text/html,application/json" },
    redirect: "follow",
  });
  const cookies = res.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
  const html = await res.text();
  const host = new URL(res.url).host;
  return { board: boardFromHtml(html, host) ?? boardFromUrl(res.url), cookies };
}

function locationFromDetail(info: WorkdayDetail["jobPostingInfo"]): string {
  if (!info) return "";
  const city =
    info.location ||
    info.jobRequisitionLocation?.descriptor ||
    "";
  const country =
    info.country?.descriptor ||
    info.jobRequisitionLocation?.country?.descriptor ||
    "";
  if (city && country) return `${city}, ${country}`;
  return city || country;
}

async function fetchDetail(
  board: Board,
  cookies: string,
  externalPath: string,
): Promise<{ description: string; location: string }> {
  const path = externalPath.startsWith("/") ? externalPath : `/${externalPath}`;
  const url = `https://${board.host}/wday/cxs/${board.tenant}/${board.site}${path}`;
  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookies,
      Referer: `https://${board.host}/${board.site}`,
    },
  });
  if (!res.ok) return { description: "", location: "" };
  const detail = (await res.json()) as WorkdayDetail;
  return {
    description: detail.jobPostingInfo?.jobDescription ?? "",
    location: locationFromDetail(detail.jobPostingInfo),
  };
}

export async function ingestWorkday(company: Company): Promise<NormalizedJob[]> {
  let board: Board | null =
    company.host && company.tenant && company.site
      ? { host: company.host, tenant: company.tenant, site: company.site }
      : boardFromUrl(company.careerUrl);

  const opened = await openBoard(company.careerUrl);
  const cookies = opened.cookies;
  if (opened.board) board = opened.board;
  if (!board) {
    throw new Error(`Workday board not found for ${company.name}`);
  }

  const jobs: NormalizedJob[] = [];
  const seen = new Set<string>();
  const limit = 20;

  for (const searchText of companySearchTexts(company)) {
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < 400) {
      const url = `https://${board.host}/wday/cxs/${board.tenant}/${board.site}/jobs`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...BROWSER_HEADERS,
          "Content-Type": "application/json",
          Cookie: cookies,
          Referer: `https://${board.host}/${board.site}`,
        },
        body: JSON.stringify({
          appliedFacets: {},
          limit,
          offset,
          searchText,
        }),
      });
      if (!res.ok) {
        throw new Error(`Workday ${company.name} ${res.status} ${url}`);
      }
      const page = (await res.json()) as WorkdayPage;
      total = page.total ?? 0;
      const postings = page.jobPostings ?? [];
      for (const posting of postings) {
        const title = posting.title ?? "";
        const path = posting.externalPath ?? "";
        const sourceId = path || title;
        if (seen.has(sourceId)) continue;
        const applyUrl = path.startsWith("http")
          ? path
          : `https://${board.host}/${board.site}${path}`;
        const listLocation = posting.locationsText ?? "";
        const preview = toJob(company, {
          sourceId,
          title,
          location: listLocation,
          postedAt: posting.postedOn ?? null,
          applyUrl,
          description: title,
        });
        if (!preview) continue;
        seen.add(sourceId);
        const detail = path
          ? await fetchDetail(board, cookies, path)
          : { description: title, location: "" };
        const location = enrichLocationWithCityState(
          detail.location.trim() || listLocation,
          detail.description || title,
        );
        const normalized = toJob(company, {
          sourceId,
          title,
          location,
          postedAt: posting.postedOn ?? null,
          applyUrl,
          description: detail.description || title,
        });
        if (normalized) jobs.push(normalized);
      }
      if (postings.length === 0) break;
      offset += limit;
    }
  }
  return jobs;
}
