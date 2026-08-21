/**
 * Detect remote / hybrid work arrangements from location + job description.
 *
 * Prefer explicit workplace-arrangement phrasing over bare "remote"/"hybrid"
 * tokens so we skip product language ("hybrid packaging") and negations
 * ("not a remote role", "remote assignments will not be considered").
 */

const LOCATION_REMOTE =
  /\b(remote|hybrid|work from home|wfh|telecommute|telework)\b/i;

/** LinkedIn Recruiter location tags embedded in many ATS postings. */
const LI_TAG = /#li[-_](hybrid|remote)\b/i;

/**
 * "Workplace type: Hybrid", "Work Arrangements: Hybrid",
 * "Work Flexibility: Hybrid", "Work Environment • Hybrid: …"
 */
const WORKPLACE_LABEL =
  /\b(?:workplace\s+type|work\s+arrangements?|work\s+(?:environment|flexibility|location|model|style)|working\s+(?:model|arrangement)|location\s+type)\b[\s:.\-–—•|]*[^\n]{0,80}?\b(hybrid|remote)\b/i;

const HYBRID_FLEX = /\bhybrid\s*\/\s*flex\b/i;

const WFH = /\bwork(?:ing)?\s+from\s+home\b|\bwfh\b|\btelecommute\b|\btelework\b/i;

/**
 * Arrangement noun phrases: "remote work", "hybrid role", "Hybrid:", etc.
 * Captures the match start so callers can inspect surrounding negation.
 */
const ARRANGEMENT =
  /\b(?:fully\s+)?(?:remote|hybrid)\s+(?:work|role|position|job|schedule|arrangement|environment|flexibility|options?|based|friendly|employee|assignments?|office)|(?:^|[\n•|\-–—])\s*(?:remote|hybrid)\s*:/gi;

const NEGATION_BEFORE =
  /\b(?:not\s+(?:an?\s*)?|no\s+|non[- ]|never\s+|isn't\s+(?:an?\s*)?|is\s+not\s+(?:an?\s*)?)$/i;

const NEGATION_AFTER =
  /\b(?:will\s+)?not\s+be\s+considered\b|\bis\s+not\s+(?:available|permitted|allowed|offered|supported)\b|\bnot\s+available\b|\bnot\s+offered\b/i;

const HYBRID_PRODUCT = /\bhybrid\s+packag/i;

function negatedArrangement(text: string, index: number, matched: string): boolean {
  const before = text.slice(Math.max(0, index - 32), index);
  if (NEGATION_BEFORE.test(before)) return true;

  const after = text.slice(index, index + matched.length + 72);
  if (/\bremote\b/i.test(matched) && NEGATION_AFTER.test(after)) return true;

  if (HYBRID_PRODUCT.test(text.slice(index, index + 40))) return true;

  return false;
}

export function isRemote(location: string, description: string): boolean {
  if (LOCATION_REMOTE.test(location)) return true;

  const text = description;
  if (!text) return false;

  if (LI_TAG.test(text)) return true;
  if (WORKPLACE_LABEL.test(text)) return true;
  if (HYBRID_FLEX.test(text)) return true;
  if (WFH.test(text)) return true;

  ARRANGEMENT.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ARRANGEMENT.exec(text)) !== null) {
    if (!negatedArrangement(text, match.index, match[0])) return true;
  }

  return false;
}
