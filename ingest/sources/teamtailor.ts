import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import type { Company, NormalizedJob } from "../types.ts";

type TeamtailorFeed = {
  items?: TeamtailorItem[];
  next_url?: string;
};

type TeamtailorItem = {
  id?: string;
  title?: string;
  url?: string;
  date_published?: string;
  content_html?: string;
  _jobposting?: {
    jobLocation?: JobLocation | JobLocation[];
  };
};

type JobLocation = {
  address?: {
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
};

function flattenLocation(item: TeamtailorItem): string {
  const raw = item._jobposting?.jobLocation;
  const locations = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const parts = locations.map((location) => {
    const address = location.address ?? {};
    return [
      address.addressLocality,
      address.addressRegion,
      address.postalCode,
      address.addressCountry,
    ]
      .filter(Boolean)
      .join(", ");
  });
  return parts.filter(Boolean).join(" · ");
}

export async function ingestTeamtailor(
  company: Company,
): Promise<NormalizedJob[]> {
  const origin = new URL(company.careerUrl).origin;
  let url: string | undefined = `${origin}/jobs.json`;
  const seen = new Set<string>();
  const jobs: NormalizedJob[] = [];

  while (url && seen.size < 8) {
    seen.add(url);
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) {
      throw new Error(`Teamtailor ${company.name} ${res.status} ${url}`);
    }
    const feed = (await res.json()) as TeamtailorFeed;
    for (const item of feed.items ?? []) {
      const normalized = toJob(company, {
        sourceId: item.id || item.url || item.title || "",
        title: item.title ?? "",
        location: flattenLocation(item),
        postedAt: item.date_published ?? null,
        applyUrl: item.url || company.careerUrl,
        description: stripHtml(item.content_html ?? item.title ?? ""),
      });
      if (normalized) jobs.push(normalized);
    }
    url = feed.next_url && !seen.has(feed.next_url) ? feed.next_url : undefined;
  }
  return jobs;
}
