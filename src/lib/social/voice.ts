/**
 * Brand voice + LinkedIn hashtag guidance for social drafts.
 * Canonical source: MARKETING.md §4–5, SOCIAL_MEDIA_PLAN.md §12.
 */

export type VerticalVoiceProfile = {
  hubLabel: string;
  specialtyTerms: string[];
  hashtagPool: string[];
  contrastRequired: boolean;
};

const BANNED_COPY_PATTERNS: RegExp[] = [
  /\bdream job\b/i,
  /\bpassion\b/i,
  /\bdisrupt/i,
  /\bAI[- ]powered matching\b/i,
  /\b#1\b/i,
  /\bthousands of jobs\b/i,
  /\btalent pool unlock\b/i,
  /\blimited[- ]time\b/i,
  /\bwe're (?:so )?excited\b/i,
  /\bthrilled\b/i,
  /\bunlock premium\b/i,
  /\brevolutionary\b/i,
  /\bnicheboard\b/i,
  /\bnicheboard jobs\b/i,
];

const BANNED_HASHTAGS = new Set(
  [
    "dreamjob",
    "hiring",
    "jobsearch",
    "jobs",
    "careers",
    "nowhiring",
    "jobopening",
    "talent",
    "recruitment",
    "passion",
    "disrupt",
    "nicheboard",
    "nicheboardjobs",
  ].map(normalizeHashtag),
);

const VERTICAL_VOICE: Record<string, VerticalVoiceProfile> = {
  packaging: {
    hubLabel: "Packaging",
    specialtyTerms: [
      "packaging engineer",
      "package development",
      "package-development",
      "CPG",
    ],
    hashtagPool: [
      "PackagingEngineering",
      "PackageDevelopment",
      "CPGJobs",
      "PackagingJobs",
      "SustainablePackaging",
      "FoodPackaging",
      "PharmaPackaging",
      "PackagingDesign",
      "PackagingCareers",
      "NicheBoard",
    ],
    contrastRequired: true,
  },
  businesscontinuity: {
    hubLabel: "Resilience",
    specialtyTerms: [
      "business continuity",
      "BCM",
      "disaster recovery",
      "resilience",
    ],
    hashtagPool: [
      "BusinessContinuity",
      "BCM",
      "DisasterRecovery",
      "Resilience",
      "RiskManagement",
      "GRC",
      "OperationalResilience",
      "CrisisManagement",
      "NicheBoard",
    ],
    contrastRequired: true,
  },
};

const NETWORK_HASHTAG = "NicheBoard";

export function verticalVoiceProfile(verticalId: string): VerticalVoiceProfile {
  return VERTICAL_VOICE[verticalId] ?? {
    hubLabel: verticalId,
    specialtyTerms: [],
    hashtagPool: ["NicheBoard", "SpecialistJobs", "JobAlerts"],
    contrastRequired: false,
  };
}

/** Condensed MARKETING.md voice rules for Grok system prompt. */
export function buildBrandVoicePromptBlock(): string {
  return [
    "BRAND VOICE (MARKETING.md): friendly but not eager; trustworthy and uplifting; a little fun.",
    "Formula: Contrast + one proof + one CTA. Short sentences. Concrete nouns.",
    "Use: packaging engineer, package development, specialist board, pin, live listing, career site/ATS, updated daily, job alerts, Niche Board (network only, two words).",
    "Avoid: dream job, passion, disrupt, AI-powered matching, #1, thousands of jobs, easy apply (unless ATS), talent pool unlock, limited-time hype, emojis, exclamation piles, faux-urgency.",
    "Never invent metrics, candidate counts, open rates, or hire-in-X-days claims.",
    "Competitive frame: niches too narrow for LinkedIn / roles LinkedIn buries — not blanket 'better than LinkedIn'.",
    "Packaging vertical: always include contrast 'Package development — not plant ops.' on packaging content.",
    "Resilience vertical: contrast 'BCM & disaster recovery — not generic IT.' when relevant.",
    "Do not lead with 'free'. Candidates browse and get alerts at no charge — mention only if contrasting a paid competitor.",
    "Canonical names: Niche Board (two words). Hub label Packaging or Resilience — not Nicheboard, Nicheboard Jobs, or Packaging Nicheboard.",
  ].join(" ");
}

export function buildHashtagPromptBlock(verticalId: string): string {
  const profile = verticalVoiceProfile(verticalId);
  return [
    "HASHTAGS (separate from post body): return 3–5 LinkedIn hashtags for reach.",
    `Pick from this specialty pool and context: ${profile.hashtagPool.join(", ")}.`,
    "Prefer specialty tags (e.g. PackagingEngineering, BCM) over generic #Hiring or #Jobs.",
    "Use PascalCase or single words — no spaces inside hashtags.",
    "Include NicheBoard at most once when the post mentions the network.",
    "Never use: DreamJob, Hiring, JobSearch, Jobs, NowHiring, Passion, Disrupt, Nicheboard.",
    "Do not put hashtags inside the post text — only in the hashtags array.",
  ].join(" ");
}

export function normalizeHashtag(raw: string): string {
  return raw.replace(/^#+/, "").replace(/\s+/g, "").trim();
}

export function formatHashtag(raw: string): string {
  const normalized = normalizeHashtag(raw);
  return normalized ? `#${normalized}` : "";
}

export function sanitizeHashtags(
  raw: string[] | undefined,
  verticalId: string,
): string[] {
  const profile = verticalVoiceProfile(verticalId);
  const poolSet = new Set(profile.hashtagPool.map(normalizeHashtag));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of raw ?? []) {
    const tag = normalizeHashtag(entry);
    if (!tag || seen.has(tag) || BANNED_HASHTAGS.has(tag.toLowerCase())) continue;
    seen.add(tag);
    result.push(tag);
    if (result.length >= 5) break;
  }

  if (result.length < 3) {
    for (const poolTag of profile.hashtagPool) {
      const tag = normalizeHashtag(poolTag);
      if (seen.has(tag) || BANNED_HASHTAGS.has(tag.toLowerCase())) continue;
      seen.add(tag);
      result.push(tag);
      if (result.length >= 3) break;
    }
  }

  const networkTag = normalizeHashtag(NETWORK_HASHTAG);
  const networkCount = result.filter((tag) => tag === networkTag).length;
  if (networkCount > 1) {
    let kept = false;
    return result.filter((tag) => {
      if (tag !== networkTag) return true;
      if (!kept) {
        kept = true;
        return true;
      }
      return false;
    });
  }

  return result.slice(0, 5);
}

/** Fallback hashtags when Grok omits them. */
export function defaultHashtagsForVertical(
  verticalId: string,
  postType: string,
): string[] {
  const profile = verticalVoiceProfile(verticalId);
  const picks = [...profile.hashtagPool];

  if (postType === "employer") {
    const employerBoost = ["EmployerBranding", "TalentAcquisition"];
    picks.unshift(...employerBoost);
  }

  return sanitizeHashtags(picks.slice(0, 5), verticalId);
}

export type ToneReview = {
  warnings: string[];
  passed: boolean;
};

export function reviewDraftTone(input: {
  draft: string;
  verticalId: string;
  contrastLine?: string;
}): ToneReview {
  const warnings: string[] = [];
  const profile = verticalVoiceProfile(input.verticalId);

  for (const pattern of BANNED_COPY_PATTERNS) {
    const match = input.draft.match(pattern);
    if (match) {
      warnings.push(`Avoid phrase: "${match[0]}"`);
    }
  }

  if (input.draft.includes("!!!") || /!{2,}/.test(input.draft)) {
    warnings.push("Reduce exclamation marks — tone should stay calm.");
  }

  if (/[\u{1F300}-\u{1FAFF}]/u.test(input.draft)) {
    warnings.push("Remove emojis — brand voice avoids them on LinkedIn.");
  }

  if (profile.contrastRequired && input.contrastLine) {
    const contrastCore = input.contrastLine.replace(/\s*—\s*.+$/, "").trim();
    if (
      contrastCore.length > 4 &&
      !input.draft.toLowerCase().includes(contrastCore.toLowerCase())
    ) {
      warnings.push(
        `Packaging/resilience posts should include contrast: "${input.contrastLine}"`,
      );
    }
  }

  const inlineHashtags = input.draft.match(/#[\w]+/g);
  if (inlineHashtags && inlineHashtags.length > 0) {
    warnings.push(
      "Move hashtags out of the post body — paste suggested tags separately on LinkedIn.",
    );
  }

  return { warnings, passed: warnings.length === 0 };
}

export type ParsedGrokDraft = {
  post: string;
  hashtags: string[];
};

export function parseGrokDraftResponse(
  raw: string,
  verticalId: string,
  postType: string,
): ParsedGrokDraft {
  const trimmed = raw.trim();

  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        post?: string;
        draft?: string;
        hashtags?: string[];
        tags?: string[];
      };
      const post = (parsed.post ?? parsed.draft ?? "").trim();
      const hashtags = sanitizeHashtags(
        parsed.hashtags ?? parsed.tags,
        verticalId,
      );
      if (post) {
        return {
          post: stripInlineHashtags(post),
          hashtags:
            hashtags.length >= 3
              ? hashtags
              : defaultHashtagsForVertical(verticalId, postType),
        };
      }
    }
  } catch {
    // fall through to plain-text parse
  }

  return {
    post: stripInlineHashtags(trimmed),
    hashtags: defaultHashtagsForVertical(verticalId, postType),
  };
}

function stripInlineHashtags(text: string): string {
  return text
    .replace(/(?:^|\s)#[\w]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
