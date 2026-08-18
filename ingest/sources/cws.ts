import { BROWSER_HEADERS, slugify, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

type CwsJob = {
  id?: number | string;
  ref?: string;
  title?: string;
  function?: string;
  primary_city?: string;
  primary_state?: string;
  primary_country?: string;
  open_date?: string;
  description?: string;
};

type CwsPage = {
  totalHits?: number;
  queryResult?: CwsJob[];
};

const DEFAULT_HOST = "jobsapi-internal.m-cloud.io";
const PAGE_SIZE = 20;

function parsePayload(text: string): CwsPage {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("CWS response was not JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as CwsPage;
}

function locationOf(job: CwsJob): string {
  return [job.primary_city, job.primary_state, job.primary_country]
    .filter(Boolean)
    .join(", ");
}

function applyUrl(company: Company, job: CwsJob): string {
  const origin = new URL(company.careerUrl).origin;
  const id = job.id ?? job.ref ?? "";
  const slug = slugify(job.title ?? "");
  return slug ? `${origin}/job/${id}/${slug}` : `${origin}/job/${id}`;
}

export async function ingestCws(company: Company): Promise<NormalizedJob[]> {
  const orgId = company.orgId ?? company.boardToken;
  if (!orgId) throw new Error(`CWS org id missing for ${company.name}`);

  const host = company.host ?? DEFAULT_HOST;
  const query = company.searchText ?? "packaging";
  const jobs: NormalizedJob[] = [];
  let offset = 1;
  let total = Infinity;

  while (offset <= total && offset < 400) {
    const params = new URLSearchParams({
      Organization: orgId,
      Limit: String(PAGE_SIZE),
      offset: String(offset),
      SearchText: query,
      sortfield: "open_date",
      sortorder: "descending",
      useBooleanKeywordSearch: "true",
      callback: "cb",
    });
    for (const facet of company.facets ?? []) {
      params.append("facet", facet);
    }

    const url = `https://${host}/api/job?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: "application/javascript, application/json",
        Referer: company.careerUrl,
      },
    });
    if (!res.ok) {
      throw new Error(`CWS ${company.name} ${res.status} ${url}`);
    }
    const page = parsePayload(await res.text());
    total = page.totalHits ?? 0;
    const postings = page.queryResult ?? [];
    for (const posting of postings) {
      const title = posting.title ?? "";
      const normalized = toJob(company, {
        sourceId: String(posting.ref ?? posting.id ?? title),
        title,
        department: posting.function ?? null,
        location: locationOf(posting),
        postedAt: posting.open_date ?? null,
        applyUrl: applyUrl(company, posting),
        description: posting.description || title,
      });
      if (normalized) jobs.push(normalized);
    }
    if (postings.length === 0) break;
    offset += PAGE_SIZE;
  }

  return jobs;
}
