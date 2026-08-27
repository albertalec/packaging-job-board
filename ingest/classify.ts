import { createHash } from "node:crypto";
import { htmlToPlainText } from "../src/lib/description.ts";
import { isRemote } from "../src/lib/remote.ts";
import { parseState } from "../src/lib/states.ts";
import { toJob as toDisasterRecoveryJob } from "./classify-disasterrecovery.ts";
import type { Company, Niche, NormalizedJob } from "./types.ts";

export { isRemote };

type IngestClassifier = "packaging" | "disasterrecovery";

let activeClassifier: IngestClassifier = "packaging";

export function setIngestClassifier(classifier: string) {
  activeClassifier =
    classifier === "disasterrecovery" ? "disasterrecovery" : "packaging";
}

const SEMICONDUCTOR =
  /\b(semiconductor|wafer|osat|flip[ -]?chip|wirebond|chiplet|\bsip\b|\bsoc\b|advanced packaging|ic packaging|soc packaging|electronics packaging|avionics (mechanical|packaging)|package[- ]level|integrated circuit|silicon up)\b/i;

const WAREHOUSE =
  /\b(forklift|warehouse associate|warehouse lead|package handler|order picker|packer|material handler|production associate|packaging associate|packaging operator|packaging inspector|packaging technician|packaging tech|packaging mechanic|packaging apprentice|packaging machinist|process operator|machine operator|general entry|production supervisor|manufacturing supervisor|technical support representative)\b/i;

/** Buying, selling, plant ops, or running a converting line — not package design / R&D. */
const OFF_TARGET =
  /\b(procurement|category manager|category management|account manager|\bsales\b|business development|commodity(?:\s+\w+){0,3}\s+manager|commodity risk|\bbuyer\b|\bsourcing\b|corrugator|corrugated supervisor|fleet budget|creative director|art director|graphic designer|system user|delivery leader|packaging equipment|packaging machinery|plant electrician|\boiler\b|hris|\behs\b|process lead|packaging production|artwork coordinator|brand applications|packaging operation|aseptic packaging operation|label packaging|operations manager|manufacturing packaging|manufacturing process.{0,40}packaging|manufacturing\s*(?:&|and)\s*packaging)\b/i;

/** Packaging names a commodity/category scope, not the job (e.g. "Energy & Packaging"). */
const PACKAGING_AS_SCOPE = /&\s*packaging\s*$/i;

const ROLE =
  /\b(packag(?:e|ing) (?:engineer|engineering|manager|management|scientist|science|sciences|designer|design|developer|development|technologist|lead|director|r&d|innovation|compliance|systems)|package development|r&d packaging|research(?: and | ?& ?)development packaging|structural packaging|returnable packaging|dunnage|converting engineer|package engineering|custom packaging design|packaging innovation|engineer(?:\s*ii|\s*iii|\s*2|\s*3)?, packaging)\b/i;

const CORE_FUNCTION =
  /\b(engineer|\beng\b|scientist|technologist|designer|design|developer|development|r&d|research|manager|management|director|intern|co-?op)\b/i;

const AMBIGUOUS_PACKAGING = /\bpackag/i;

export function classifyJob(input: {
  title: string;
  description: string;
  department?: string | null;
}): { keep: boolean; reason: string } {
  const blob = `${input.title}\n${input.department ?? ""}\n${input.description}`;
  const titleAndDept = `${input.title}\n${input.department ?? ""}`;
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
  if (OFF_TARGET.test(titleAndDept)) {
    return { keep: false, reason: "off-target function" };
  }
  if (
    /\bprocess engineer\b/i.test(input.title) &&
    !/\bpackag(?:e|ing) (?:engineer|engineering)\b/i.test(input.title)
  ) {
    return { keep: false, reason: "plant process engineering" };
  }
  if (ROLE.test(input.title)) {
    return { keep: true, reason: "packaging role match" };
  }
  if (
    AMBIGUOUS_PACKAGING.test(input.title) &&
    CORE_FUNCTION.test(input.title) &&
    !ROLE.test(input.title) &&
    PACKAGING_AS_SCOPE.test(input.title)
  ) {
    return { keep: false, reason: "packaging as commodity/category scope" };
  }
  if (
    AMBIGUOUS_PACKAGING.test(input.title) &&
    CORE_FUNCTION.test(input.title) &&
    !/\b(fulfillment|electronics|avionics|ic\/soc|optical|optics|operator|technician|cloud hardware)\b/i.test(
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
  return htmlToPlainText(html);
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
  if (activeClassifier === "disasterrecovery") {
    return toDisasterRecoveryJob(company, input);
  }
  const verdict = classifyJob({
    title: input.title,
    description: stripHtml(input.description) || input.title.trim(),
    department: input.department,
  });
  if (!verdict.keep) return null;
  const plain = stripHtml(input.description) || input.title.trim();
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
    remote: isRemote(input.location, plain),
    postedAt: input.postedAt ?? null,
    applyUrl: input.applyUrl,
    description: plain,
    salary: input.salary ?? null,
    niche: inferNiche(
      company.niche,
      `${input.title} ${input.department ?? ""} ${plain}`,
    ),
    source: company.ats,
  };
}

export const BROWSER_HEADERS = {
  "User-Agent":
    "PackagingJobBoard/0.1 (+https://github.com/albertalec/packaging-job-board)",
  Accept: "application/json,text/html;q=0.9",
};
