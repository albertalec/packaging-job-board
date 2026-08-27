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
  /\b(account manager|sales|business development|recruiter|talent acquisition|marketing manager|product manager|project manager|scrum master|agile coach|data analyst|business analyst)\b/i;

/** Product / SRE “resilience” noise — not BCM / DR. */
const RESILIENCE_NOISE =
  /\b(site reliability|sre\b|chaos engineering|product resilience|brand resilience|application resilience|platform resilience|service resilience)\b/i;

const CONTINUITY_SIGNAL =
  /\b(business continuity|continuity of (?:operations|business)|coo\b|cob\b|bcm\b|disaster recovery|\bdr\b|bc\/dr|bcdr|crisis management|emergency management|it continuity|technology continuity|recovery manager|continuity manager|continuity planner|resilience engineer|resilience manager|resilience architect|dr architect|bcp\b|crisis response|operational resilience|enterprise resilience|global business resilience)\b/i;

const CORE_ROLE =
  /\b(business continuity|continuity of (?:operations|business)|disaster recovery|operational resilience|enterprise resilience|global business resilience|crisis management|emergency preparedness|it continuity|technology continuity|recovery manager|continuity manager|continuity planner|bcm (?:manager|director|analyst|coordinator|specialist|lead)|bc\/dr|bcdr|resilience (?:engineer|manager|director|architect|lead|analyst|specialist|advisor)|dr (?:architect|engineer|manager|director|lead|specialist|analyst|coordinator)|crisis (?:manager|director|lead|specialist)|continuity of business)\b/i;

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
  if (GENERIC_IT.test(title) && !CONTINUITY_SIGNAL.test(title)) {
    return { keep: false, reason: "generic IT title" };
  }
  if (OFF_TARGET.test(title) && !CONTINUITY_SIGNAL.test(title)) {
    return { keep: false, reason: "off-target function" };
  }
  if (CORE_ROLE.test(title)) {
    return { keep: true, reason: "BCM/DR role match" };
  }
  // Prefer title-primary continuity signal; description-only is harder to pass.
  if (
    CONTINUITY_SIGNAL.test(title) &&
    /\b(manager|director|lead|architect|engineer|analyst|specialist|coordinator|consultant|officer|head|advisor|svp|vp)\b/i.test(
      title,
    )
  ) {
    return { keep: true, reason: "continuity signal in title" };
  }
  if (
    CONTINUITY_SIGNAL.test(blob) &&
    /\b(manager|director|lead|architect|engineer|analyst|specialist|coordinator|consultant|officer|head|advisor)\b/i.test(
      title,
    ) &&
    /\b(continuity|disaster recovery|bcm|crisis|bc\/dr|bcdr|cob\b|resilience)\b/i.test(
      title,
    )
  ) {
    return { keep: true, reason: "continuity signal with senior IC/manager title" };
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
