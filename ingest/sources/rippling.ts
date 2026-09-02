import { BROWSER_HEADERS, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type RipplingLocation = {
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  workplaceType?: string;
};

type RipplingJob = {
  id: string;
  name?: string;
  url?: string;
  department?: { name?: string };
  locations?: RipplingLocation[];
};

function boardSlug(company: Company): string {
  if (company.boardToken) return company.boardToken;
  const match = company.careerUrl.match(/ats\.rippling\.com\/([^/?#]+)/i);
  if (match?.[1]) return match[1];
  throw new Error(`Rippling board slug missing for ${company.name}`);
}

function formatLocation(locations: RipplingLocation[] | undefined): string {
  const loc = locations?.[0];
  if (!loc) return "";
  const cityState = [loc.city, loc.stateCode || loc.state].filter(Boolean).join(", ");
  const country =
    loc.countryCode && loc.countryCode !== "US" ? loc.country || loc.countryCode : "";
  const base = [cityState, country].filter(Boolean).join(", ");
  if (loc.workplaceType === "REMOTE") {
    return base ? `${base} (Remote)` : "Remote";
  }
  return base;
}

function parseJobPosts(html: string): RipplingJob[] {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) return [];
  const payload = JSON.parse(match[1]) as {
    props?: {
      pageProps?: {
        dehydratedState?: {
          queries?: Array<{
            queryKey?: unknown[];
            state?: { data?: { items?: RipplingJob[] } };
          }>;
        };
      };
    };
  };
  const queries = payload.props?.pageProps?.dehydratedState?.queries ?? [];
  const jobQuery = queries.find((query) =>
    (query.queryKey ?? []).some((part) => String(part).includes("job-posts")),
  );
  return jobQuery?.state?.data?.items ?? [];
}

export async function ingestRippling(company: Company): Promise<IngestResult> {
  const slug = boardSlug(company);
  const boardUrl = `https://ats.rippling.com/${slug}/jobs`;
  const res = await fetch(boardUrl, {
    headers: {
      ...BROWSER_HEADERS,
      Accept: "text/html,application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Rippling ${company.name} ${res.status} ${boardUrl}`);
  }
  const stats = new IngestStats();
  const jobs = [];
  for (const posting of parseJobPosts(await res.text())) {
    const title = posting.name?.trim() ?? "";
    const sourceId = posting.id;
    if (!title || !sourceId) continue;
    stats.recordScan(sourceId);
    const normalized = toJob(
      company,
      {
        sourceId,
        title,
        department: posting.department?.name ?? null,
        location: formatLocation(posting.locations),
        postedAt: null,
        applyUrl: posting.url || `${boardUrl}/${sourceId}`,
        description: title,
      },
      stats,
    );
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
