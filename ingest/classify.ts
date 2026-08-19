import { createHash } from "node:crypto";
import { parseState } from "../src/lib/states.ts";
import type { Company, Niche, NormalizedJob } from "./types.ts";

const SEMICONDUCTOR =
  /\b(semiconductor|wafer|osat|flip[ -]?chip|wirebond|chiplet|\bsip\b|\bsoc\b|advanced packaging|ic packaging|soc packaging|electronics packaging|avionics (mechanical|packaging)|package[- ]level|integrated circuit|silicon up)\b/i;

const WAREHOUSE =
  /\b(forklift|warehouse associate|warehouse lead|package handler|order picker|packer|material handler|production associate|packaging associate|packaging operator|packaging inspector|packaging technician|packaging tech|packaging mechanic|packaging apprentice|packaging machinist|process operator|machine operator|general entry|production supervisor|manufacturing supervisor|technical support representative)\b/i;

const ROLE =
  /\b(packag(?:e|ing) (?:engineer|engineering|manager|management|scientist|science|specialist|designer|design|developer|development|technologist|technician|coordinator|supervisor|lead|director|r&d|innovation)|package development|structural packaging|flexible packaging|rigid packaging|primary packaging|secondary packaging|returnable packaging|dunnage|converting engineer|corrugat(?:ed|or)|package engineering)\b/i;

const AMBIGUOUS_PACKAGING = /\bpackag/i;

export function classifyJob(input: {
  title: string;
  description: string;
  department?: string | null;
}): { keep: boolean; reason: string } {
  const blob = `${input.title}\n${input.department ?? ""}\n${input.description}`;
  if (SEMICONDUCTOR.test(blob)) {
    return { keep: false, reason: "semiconductor/electronics packaging" };
  }
  if (
    /\b(application packaging|head-up display|\bhud\b)\b/i.test(input.title)
  ) {
    return { keep: false, reason: "software/electronics packaging" };
  }
  if (
    /\bmechanical packaging\b/i.test(input.title) &&
    !/\b(returnable|dunnage|container|corrugat)\b/i.test(input.title)
  ) {
    return { keep: false, reason: "electronics/mechanical packaging" };
  }
  if (WAREHOUSE.test(input.title)) {
    return { keep: false, reason: "warehouse/ops title" };
  }
  if (ROLE.test(input.title)) {
    return { keep: true, reason: "packaging role match" };
  }
  if (
    AMBIGUOUS_PACKAGING.test(input.title) &&
    !/\b(robotics|fulfillment|electronics|avionics|ic\/soc|optical|optics|operator|technician|cloud hardware)\b/i.test(
      input.title,
    )
  ) {
    return { keep: true, reason: "title contains packaging" };
  }
  return { keep: false, reason: "not a packaging role" };
}

export function inferNiche(
  companyNiche: Niche | undefined,
  text: string,
): Niche | null {
  const blob = text.toLowerCase();
  if (/\b(automotive|oem|dunnage|returnable|tier[- ]?1)\b/.test(blob)) {
    return "automotive";
  }
  if (/\b(pharma|pharmaceutical|medical device|sterile|aseptic)\b/.test(blob)) {
    return "pharma";
  }
  if (/\b(food|beverage|cpg|consumer packaged|snack|pet food)\b/.test(blob)) {
    return companyNiche === "cpg" ? "cpg" : "food-beverage";
  }
  return companyNiche ?? null;
}

export function jobHash(company: string, sourceId: string, title: string): string {
  return createHash("sha256")
    .update(`${company}|${sourceId}|${title}`)
    .digest("hex")
    .slice(0, 16);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

export function isRemote(location: string, description: string): boolean {
  return /\b(remote|hybrid|work from home|wfh)\b/i.test(
    `${location} ${description.slice(0, 400)}`,
  );
}

export function isUsOrRemote(
  job: {
    state: string | null;
    remote: boolean;
    location: string;
  },
  opts?: { homeCountry?: string },
): boolean {
  const location = job.location;
  const mentionsUs = /\b(united states|\bu\.s\.a\.\b|\bu\.s\.\b|\busa\b)\b/i.test(
    location,
  );
  const mentionsAbroad =
    /\b(canada|ontario|quebec|alberta|manitoba|saskatchewan|united kingdom|\buk\b|england|scotland|wales|ireland|philippines|india|(?<!\bnew )mexico|germany|france|china|brazil|australia|japan|poland|hungary|romania|slovakia|austria|spain|italy|netherlands|sweden|singapore)\b/i.test(
      location,
    );
  if (mentionsAbroad && !mentionsUs) return false;
  if (job.remote) return true;
  if (job.state) return true;
  if (mentionsUs) return true;
  // Workday collapses multi-site US postings to "4 Locations"
  if (
    opts?.homeCountry === "USA" &&
    /^\d+\s+Locations$/i.test(location.trim())
  ) {
    return true;
  }
  return false;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function toJob(
  company: Company,
  input: {
    sourceId: string;
    title: string;
    department?: string | null;
    location: string;
    postedAt?: string | null;
    applyUrl: string;
    description: string;
    salary?: string | null;
  },
): NormalizedJob | null {
  const verdict = classifyJob({
    title: input.title,
    description: stripHtml(input.description) || input.title.trim(),
    department: input.department,
  });
  if (!verdict.keep) return null;
  const hash = jobHash(company.slug, input.sourceId, input.title);
  return {
    id: `${company.slug}-${hash}`,
    sourceId: input.sourceId,
    hash,
    company: company.name,
    companySlug: company.slug,
    title: input.title.trim(),
    department: input.department ?? null,
    location: input.location.trim() || "Location not listed",
    state: parseState(input.location) ?? parseState(input.sourceId),
    remote: isRemote(input.location, input.description),
    postedAt: input.postedAt ?? null,
    applyUrl: input.applyUrl,
    description: stripHtml(input.description) || input.title.trim(),
    salary: input.salary ?? null,
    niche: inferNiche(
      company.niche,
      `${input.title} ${input.department ?? ""} ${input.description}`,
    ),
    source: company.ats,
  };
}

export const BROWSER_HEADERS = {
  "User-Agent":
    "PackagingJobBoard/0.1 (+https://github.com/albertalec/packaging-job-board)",
  Accept: "application/json,text/html;q=0.9",
};
