import { createHash } from "node:crypto";
import { htmlToPlainText } from "../src/lib/description.ts";
import { isRemote } from "../src/lib/remote.ts";
import { parseState } from "../src/lib/states.ts";
import type { Company, Niche, NormalizedJob } from "./types.ts";

export { isRemote };

/** Software / endpoint packaging — not BCM. */
const SOFTWARE_PACKAGING =
  /\b(application packaging|endpoint packaging|desktop packaging|software packaging)\b/i;

/** Generic IT ops — not BCM / DR unless title carries continuity signal. */
const GENERIC_IT =
  /\b(help\s?desk|service desk|desktop support|field technician|field service|noc analyst|network engineer|systems administrator|sysadmin|database administrator|dba|software engineer|software developer|full stack|front end developer|backend developer|qa engineer|quality assurance engineer|it support|technical support representative|customer support)\b/i;

const OFF_TARGET =
  /\b(account manager|sales|business development|recruiter|talent acquisition|marketing manager|product manager|project manager|scrum master|agile coach|data analyst|business analyst|underwriter|claims (?:handler|adjuster)|catastrophe (?:analyst|model))\b/i;

/** Product / SRE “resilience” noise — not BCM / DR. */
const RESILIENCE_NOISE =
  /\b(?:site reliability|\bsre\b|chaos engineering|product resilience|brand resilience|application resilience|platform resilience|service resilience|reliability engineering|customer resilienc[ey]|data scientist|resiliency intelligence|ai resilienc[ey]|software engineer[\w\s,/-]{0,40}resilienc|resilienc[\w\s,/-]{0,40}software engineer|data engineer[\w\s,()/-]{0,50}resilienc|resilienc[\w\s,()/-]{0,50}data engineer|cloud operations resilienc|product simplification[\w\s,&/-]{0,40}resilienc)/i;

const CONTINUITY_SIGNAL =
  /\b(business continuity|continuity of (?:operations|business)|cob\b|bcm\b|disaster recovery|\bdr\b|bc\/dr|bcdr|crisis management|emergency management|it continuity|technology continuity|recovery manager|continuity manager|continuity planner|resilience engineer|resilience manager|resilience architect|dr architect|bcp\b|crisis response|operational resilienc[ey]|enterprise resilienc[ey]|global business resilienc[ey]|business(?:\s*(?:[&+/]|and)\s*\w+)?\s+resilienc[ey]|technology resilienc[ey]|organizational resilienc[ey]|operations resilienc[ey]|cyber resilienc[ey]|resiliency)\b/i;

const CORE_ROLE =
  /\b(business continuity|continuity of (?:operations|business)|disaster recovery|operational resilienc[ey]|enterprise resilienc[ey]|global business resilienc[ey]|business(?:\s*(?:[&+/]|and)\s*\w+)?\s+resilienc[ey]|technology resilienc[ey]|organizational resilienc[ey]|operations resilienc[ey]|cyber resilienc[ey]|crisis management|emergency (?:management|preparedness)|it continuity|technology continuity|recovery manager|continuity manager|continuity planner|bcm (?:manager|director|analyst|coordinator|specialist|lead)|bc\/dr|bcdr|resilienc[ey] (?:engineer|manager|director|architect|lead|analyst|specialist|advisor|risk|governance|program)|dr (?:architect|engineer|manager|director|lead|specialist|analyst|coordinator)|crisis (?:manager|director|lead|specialist|response)|continuity of business)\b/i;

export function classifyBusinessContinuityJob(input: {
  title: string;
  description: string;
  department?: string | null;
}): { keep: boolean; reason: string } {
  const title = input.title.trim();
  const blob = `${title}\n${input.department ?? ""}\n${input.description}`;

  if (SOFTWARE_PACKAGING.test(title)) {
    return { keep: false, reason: "software packaging" };
  }
  if (RESILIENCE_NOISE.test(title)) {
    return { keep: false, reason: "product/SRE resilience noise" };
  }
  if (/\bunderwriter\b/i.test(title)) {
    return { keep: false, reason: "insurance underwriting" };
  }
  if (GENERIC_IT.test(title) && !CONTINUITY_SIGNAL.test(title)) {
    return { keep: false, reason: "generic IT title" };
  }
  if (OFF_TARGET.test(title) && !CONTINUITY_SIGNAL.test(title)) {
    return { keep: false, reason: "off-target function" };
  }
  if (CORE_ROLE.test(title)) {
    return { keep: true, reason: "BCM/DR role match" };
  }
  const seniorIc =
    /\b(manager|director|lead|architect|engineer|analyst|specialist|coordinator|consultant|officer|head|advisor|svp|vp|vice president|avp|assistant vice president|managing director|md\b)\b/i;
  // Prefer title-primary continuity signal; description-only is harder to pass.
  if (CONTINUITY_SIGNAL.test(title) && seniorIc.test(title)) {
    return { keep: true, reason: "continuity signal in title" };
  }
  if (
    CONTINUITY_SIGNAL.test(blob) &&
    seniorIc.test(title) &&
    /\b(continuity|disaster recovery|bcm|crisis|bc\/dr|bcdr|cob\b|resilienc)\b/i.test(
      title,
    )
  ) {
    return { keep: true, reason: "continuity signal with senior IC/manager title" };
  }
  // Risk / control titles that own BCM programs (common in banks) when the
  // description clearly states business continuity / DR / ops resilience.
  if (
    /\b(risk|continuity|resilienc|crisis|recovery|bcm|bcp)\b/i.test(title) &&
    !/\b(operations control|trading|underwrit|actuarial|claims)\b/i.test(title) &&
    seniorIc.test(title) &&
    /\b(business continuity|disaster recovery|operational resilienc[ey]|continuity of business|BCM program|business continuity plan|\bBCP\b)\b/i.test(
      input.description,
    )
  ) {
    return { keep: true, reason: "risk title with BCM program in description" };
  }
  return { keep: false, reason: "not a BCM/DR role" };
}

export function inferDrSector(
  companyNiche: Niche | undefined,
  text: string,
): Niche | null {
  const blob = text.toLowerCase();
  if (/\b(insurance|insurer|underwriter|actuarial carrier)\b/.test(blob)) {
    return "insurance";
  }
  if (/\b(hospital|health system|healthcare|clinical|patient|medical center|payer|pharmacy benefit)\b/.test(blob)) {
    return companyNiche === "insurance" ? "insurance" : "healthcare";
  }
  if (/\b(bank|banking|capital markets|investment|asset management|financial services|brokerage)\b/.test(blob)) {
    return "finance";
  }
  return companyNiche ?? null;
}

export function jobHash(company: string, sourceId: string, title: string): string {
  return createHash("sha256")
    .update(`${company}|${sourceId}|${title}`)
    .digest("hex")
    .slice(0, 16);
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
  const verdict = classifyBusinessContinuityJob({
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
    niche: inferDrSector(
      company.niche,
      `${input.title} ${input.department ?? ""} ${plain}`,
    ),
    source: company.ats,
  };
}
