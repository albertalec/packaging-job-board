import { BROWSER_HEADERS, toJob } from "../classify.ts";
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
    jobRequisitionLocation?: { descriptor?: string };
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

async function fetchDetail(
  board: Board,
  cookies: string,
  externalPath: string,
): Promise<string> {
  const path = externalPath.startsWith("/") ? externalPath : `/${externalPath}`;
  const url = `https://${board.host}/wday/cxs/${board.tenant}/${board.site}${path}`;
  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookies,
      Referer: `https://${board.host}/${board.site}`,
    },
  });
  if (!res.ok) return "";
  const detail = (await res.json()) as WorkdayDetail;
  return detail.jobPostingInfo?.jobDescription ?? "";
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
  const limit = 20;
  let offset = 0;
  let total = Infinity;
  const searchText = company.searchText ?? "packaging";

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
      const applyUrl = path.startsWith("http")
        ? path
        : `https://${board.host}/${board.site}${path}`;
      const preview = toJob(company, {
        sourceId: path || title,
        title,
        location: posting.locationsText ?? "",
        postedAt: posting.postedOn ?? null,
        applyUrl,
        description: title,
      });
      if (!preview) continue;
      const description = path ? await fetchDetail(board, cookies, path) : title;
      const normalized = toJob(company, {
        sourceId: path || title,
        title,
        location: posting.locationsText ?? "",
        postedAt: posting.postedOn ?? null,
        applyUrl,
        description: description || title,
      });
      if (normalized) jobs.push(normalized);
    }
    if (postings.length === 0) break;
    offset += limit;
  }
  return jobs;
}
