import { createHash } from "node:crypto";
import { htmlToPlainText } from "../src/lib/description.ts";
import { isRemote } from "../src/lib/remote.ts";
import { parseState } from "../src/lib/states.ts";
import type { IngestStats } from "./stats.ts";
import type { Company, Niche, NormalizedJob } from "./types.ts";

export { isRemote };

/** Software / endpoint packaging — not BCM. */
const SOFTWARE_PACKAGING =
  /\b(application packaging|endpoint packaging|desktop packaging|software packaging)\b/i;

/** Payments/card BCP acronym — not Business Continuity Planning. */
const BCP_PAYMENTS =
  /\b(customer engagement|business cards?(?:\s*&|\s*and\s*)?\s*payments?|bc\s*&\s*p|card risk|global core payments)\b/i;

/** Field / FEMA / humanitarian disaster response — not corporate IT BCM/DR. */
const FIELD_DISASTER =
  /\b(\bfema\b|national incident management|\bnims\b|incident command system|\bics[-\s]?(?:100|200|300|400|700|800)\b|public safety answering point|\bpsap\b|humanitarian relief|emergency response agencies|federal emergency management|state emergency management offices|national guard|starlink crisis|family care liaison|prepared @ airbus)\b/i;

/** Physical / fleet emergency ops — not IT BCM programs. */
const PHYSICAL_EM_OPS =
  /\b(emergency response team|escalation manager ops|public safety answering|field events|fleet network|site-specific emergency action plans|physical security|autonomous vehicle.*(?:emergency|safety)|operations center.*(?:on-call|escalation))\b/i;

/** Factory / manufacturing capacity resiliency — not IT BCM/DR. */
const MANUFACTURING_RESILIENCY =
  /\b(capacity growth office|smart factory|digital twin|iiot|factory build|manufacturing uptime|production ramp|warehouse\/logistics fulfillment)\b/i;

const CORPORATE_BCM_TITLE =
  /\b(business continuity|disaster recovery|operational resilienc|technology resilienc|enterprise resilienc|bc\/dr|bcdr|\bbcm\b|continuity of business|technology disaster recovery|crisis management\s*&\s*business continuity|business continuity\s*&|business continuity\s*\/)\b/i;

function isFieldDisasterRole(
  title: string,
  blob: string,
): boolean {
  if (/\b(starlink crisis response|crisis response lead)\b/i.test(title)) {
    return true;
  }
  if (/\bregion crisis management coordinator\b/i.test(title)) {
    return true;
  }
  if (CORPORATE_BCM_TITLE.test(title)) {
    return false;
  }
  if (
    /\bemergency management\b/i.test(title) &&
    (FIELD_DISASTER.test(blob) || PHYSICAL_EM_OPS.test(blob))
  ) {
    return true;
  }
  if (
    /\bcrisis (?:response|management)\b/i.test(title) &&
    (FIELD_DISASTER.test(blob) ||
      /\b(family care|prepared @|physical security)\b/i.test(blob))
  ) {
    return true;
  }
  return false;
}

function isProductDrEngineering(
  title: string,
  department: string | null | undefined,
  blob: string,
): boolean {
  return (
    /\b(member of technical staff|software engineer|backend engineer|staff engineer|database engineer)\b/i.test(
      title,
    ) &&
    /\bdisaster recovery\b/i.test(title) &&
    /\b(engineering|product development|database platform|software)\b/i.test(
      `${department ?? ""}\n${blob}`,
    )
  );
}

function isManufacturingResiliency(blob: string): boolean {
  return (
    MANUFACTURING_RESILIENCY.test(blob) &&
    !/\b(it disaster recovery|technology disaster recovery|business continuity program|recovery time objective|\brto\b|\brpo\b|cbcp|bcm program)\b/i.test(
      blob,
    )
  );
}

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

/** Workday list cards often omit BCM wording — fetch JD before dropping. */
export const WORKDAY_DETAIL_PREFETCH =
  /\b(business control|risk|resilien\w*|continuity|disaster|bcm|bcp|crisis|recovery|resiliency)\b/i;

export function shouldPrefetchWorkdayDetail(title: string): boolean {
  return WORKDAY_DETAIL_PREFETCH.test(title);
}

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
  if (/\bbcp\b/i.test(title) && BCP_PAYMENTS.test(blob)) {
    return { keep: false, reason: "BCP acronym (business cards/payments)" };
  }
  if (isFieldDisasterRole(title, blob)) {
    return { keep: false, reason: "field/FEMA disaster response" };
  }
  if (isProductDrEngineering(title, input.department, blob)) {
    return { keep: false, reason: "product/database engineering DR" };
  }
  if (isManufacturingResiliency(blob)) {
    return { keep: false, reason: "manufacturing capacity resiliency" };
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
    /\b(continuity|disaster recovery|bcm|bc\/dr|bcdr|cob\b|resilien\w*|crisis management)\b/i.test(
      title,
    )
  ) {
    return { keep: true, reason: "continuity signal with senior IC/manager title" };
  }
  // Risk / control titles that own BCM programs (common in banks) when the
  // description clearly states business continuity / DR / ops resilience.
  if (
    /\b(risk|continuity|resilien\w*|crisis management|recovery|bcm|bcp)\b/i.test(title) &&
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
  if (companyNiche) return companyNiche;
  const blob = text.toLowerCase();
  if (/\b(insurance company|insurance carrier|insurer|underwriter|actuarial carrier)\b/.test(blob)) {
    return "insurance";
  }
  if (/\b(hospital|health system|healthcare|clinical|patient|medical center|payer|pharmacy benefit)\b/.test(blob)) {
    return "healthcare";
  }
  if (/\b(bank|banking|capital markets|investment|asset management|financial services|brokerage)\b/.test(blob)) {
    return "finance";
  }
  return null;
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
  stats?: IngestStats,
): NormalizedJob | null {
  const verdict = classifyBusinessContinuityJob({
    title: input.title,
    description: stripHtml(input.description) || input.title.trim(),
    department: input.department,
  });
  stats?.recordClassifierResult(input.sourceId, verdict);
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
