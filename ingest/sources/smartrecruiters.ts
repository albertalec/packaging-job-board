import { BROWSER_HEADERS, stripHtml, toJob } from "../classify.ts";
import { companySearchTexts } from "../search.ts";
import type { Company, NormalizedJob } from "../types.ts";

type SrJob = {
  id?: string;
  name?: string;
  releasedDate?: string;
  company?: { identifier?: string };
  location?: { city?: string; region?: string; country?: string; remote?: boolean };
  jobAd?: { sections?: { jobDescription?: { text?: string } } };
};

export async function ingestSmartRecruiters(
  company: Company,
): Promise<NormalizedJob[]> {
  const token = company.boardToken;
  if (!token) {
    throw new Error(`SmartRecruiters company id missing for ${company.name}`);
  }
  const jobs: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const query of companySearchTexts(company)) {
    const url = `https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=100&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`SmartRecruiters ${company.name} ${res.status}`);
    const data = (await res.json()) as { content?: SrJob[] };
    for (const job of data.content ?? []) {
      const sourceId = job.id ?? job.name ?? "";
      if (!sourceId || seen.has(sourceId)) continue;
      const locationParts = [
        job.location?.city,
        job.location?.region,
        job.location?.country,
      ].filter(Boolean);
      if (job.location?.remote) locationParts.push("Remote");
      const applyUrl = job.id
        ? `https://jobs.smartrecruiters.com/${token}/${job.id}`
        : company.careerUrl;
      const normalized = toJob(company, {
        sourceId,
        title: job.name ?? "",
        location: locationParts.join(", "),
        postedAt: job.releasedDate ?? null,
        applyUrl,
        description: stripHtml(job.jobAd?.sections?.jobDescription?.text ?? ""),
      });
      if (normalized) {
        seen.add(sourceId);
        jobs.push(normalized);
      }
    }
  }
  return jobs;
}
