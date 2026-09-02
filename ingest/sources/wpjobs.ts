import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { IngestStats, type IngestResult } from "../stats.ts";
import type { Company } from "../types.ts";

type WpJobOpening = {
  id: number;
  link: string;
  modified_gmt?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
};

function siteOrigin(careerUrl: string): string {
  return new URL(careerUrl).origin;
}

function locationFromContent(html: string, fallback = ""): string {
  const plain = stripHtml(html);
  const labeled = plain.match(/Location:\s*([^|\n]+)/i);
  if (labeled?.[1]) return labeled[1].trim();
  const cityState = plain.match(/\b([A-Za-z .'-]+,\s*[A-Z]{2})\b/);
  return cityState?.[1]?.trim() || fallback;
}

export async function ingestWpJobs(company: Company): Promise<IngestResult> {
  const origin = siteOrigin(company.careerUrl);
  const url = `${origin}/wp-json/wp/v2/awsm_job_openings?per_page=50&status=publish`;
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) {
    throw new Error(`WP Job Openings ${company.name} ${res.status} ${url}`);
  }
  const postings = (await res.json()) as WpJobOpening[];
  const stats = new IngestStats();
  const jobs = [];
  for (const posting of postings) {
    const title = posting.title?.rendered?.trim() ?? "";
    if (!title) continue;
    const sourceId = String(posting.id);
    stats.recordScan(sourceId);
    const html = posting.content?.rendered ?? "";
    const normalized = toJob(
      company,
      {
        sourceId,
        title,
        location: locationFromContent(html, company.country === "USA" ? "United States" : ""),
        postedAt: posting.modified_gmt
          ? new Date(posting.modified_gmt).toISOString()
          : null,
        applyUrl: posting.link || company.careerUrl,
        description: html || title,
      },
      stats,
    );
    if (normalized) jobs.push(normalized);
  }
  return { jobs, stats: stats.summary() };
}
