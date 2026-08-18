import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

type SfJob = {
  id?: string;
  title?: string;
  location?: string;
  postedDate?: string;
  url?: string;
  description?: string;
};

function pickJobs(payload: unknown): SfJob[] {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  for (const key of ["jobs", "jobSearchResults", "requisitionList", "data"]) {
    const value = data[key];
    if (Array.isArray(value)) return value as SfJob[];
  }
  return [];
}

function decodeCdata(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeCdata(match[1]) : "";
}

function splitTitle(raw: string): { title: string; location: string } {
  const match = raw.match(/^(.*)\s+\(([^)]+)\)\s*$/);
  if (!match) return { title: raw, location: "" };
  return { title: match[1].trim(), location: match[2].trim() };
}

async function fromRss(origin: string, query: string): Promise<SfJob[]> {
  const jobs: SfJob[] = [];
  const seen = new Set<string>();
  for (const start of [0, 20, 40, 60, 80]) {
    const url = `${origin}/services/rss/job/?locale=en_US&keywords=(${encodeURIComponent(query)})&startrow=${start}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PackagingJobBoard/0.1; +https://github.com/albertalec/packaging-job-board)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) break;
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    if (!items.length) break;
    let added = 0;
    for (const item of items) {
      const block = item[1];
      const rawTitle = tag(block, "title");
      const link = tag(block, "link") || tag(block, "guid");
      if (!rawTitle || seen.has(link || rawTitle)) continue;
      seen.add(link || rawTitle);
      const { title, location } = splitTitle(rawTitle);
      jobs.push({
        id: link || title,
        title,
        location,
        url: link,
        description: tag(block, "description"),
        postedDate: tag(block, "pubDate") || undefined,
      });
      added += 1;
    }
    if (added === 0 || items.length < 20) break;
  }
  return jobs;
}

export async function ingestSuccessFactors(
  company: Company,
): Promise<NormalizedJob[]> {
  const query = company.searchText ?? "packaging";
  const origin = new URL(company.careerUrl).origin;
  const urls = [
    `${origin}/search-jobs/results?Keywords=${encodeURIComponent(query)}`,
    `${company.careerUrl.replace(/\/$/, "")}/search-jobs/results?Keywords=${encodeURIComponent(query)}`,
  ];
  let raw: SfJob[] = [];
  for (const url of urls) {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) continue;
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("json")) {
      raw = pickJobs(await res.json());
      if (raw.length) break;
    }
  }
  if (!raw.length) raw = await fromRss(origin, query);
  if (!raw.length) {
    throw new Error(
      `SuccessFactors public JSON not available for ${company.name}`,
    );
  }
  const jobs: NormalizedJob[] = [];
  for (const job of raw) {
    const normalized = toJob(company, {
      sourceId: job.id || job.title || "",
      title: job.title ?? "",
      location: job.location ?? "",
      postedAt: job.postedDate ?? null,
      applyUrl: job.url || company.careerUrl,
      description: stripHtml(job.description ?? job.title ?? ""),
    });
    if (normalized) jobs.push(normalized);
  }
  return jobs;
}
