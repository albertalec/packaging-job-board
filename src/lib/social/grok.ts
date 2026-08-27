import type { XTweet } from "./x";

export type GrokDraftInput = {
  verticalId: string;
  brandName: string;
  contrastLine: string;
  tagline: string;
  boardUrl: string;
  sponsorUrl: string;
  postType: "current-events" | "contrast" | "fresh-role" | "proof" | "employer";
  xTweets: XTweet[];
  job?: {
    title: string;
    company: string;
    url: string;
  };
  boardStats?: {
    totalJobs: number;
    ingestedAt: string | null;
  };
};

export type GrokDraftResult =
  | { ok: true; draft: string; model: string }
  | { ok: false; skipped?: boolean; error: string };

export function grokConfigured(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function grokModel(): string {
  return process.env.GROK_MODEL?.trim() || "grok-3";
}

/** Build the system + user prompt for LinkedIn draft generation. */
export function buildGrokMessages(input: GrokDraftInput): {
  system: string;
  user: string;
} {
  const xContext =
    input.xTweets.length > 0
      ? input.xTweets
          .slice(0, 6)
          .map(
            (tweet, index) =>
              `${index + 1}. "${tweet.text}" (${tweet.createdAt || "recent"}, ${tweet.url})`,
          )
          .join("\n")
      : "No recent X posts were available — write from board context only.";

  const jobBlock = input.job
    ? `Featured role (optional anchor): ${input.job.title} at ${input.job.company} — ${input.job.url}`
    : "";

  const statsBlock = input.boardStats
    ? `Board inventory: ${input.boardStats.totalJobs} live roles${
        input.boardStats.ingestedAt
          ? `, last ingested ${input.boardStats.ingestedAt}`
          : ""
      }.`
    : "";

  const system = [
    "You write LinkedIn posts for Niche Board, a network of precision job boards.",
    "Tone: friendly but not eager, trustworthy, lightly fun. No hype, emojis, or exclamation piles.",
    "Formula: Contrast + one proof + one CTA.",
    "Never invent metrics, candidate counts, or employer claims.",
    "Use canonical brand names: Niche Board (two words). Never Nicheboard.",
    "Output ONLY the post text — no title, labels, hashtags block, or commentary.",
    "Keep under 900 characters. Use line breaks for readability.",
  ].join(" ");

  const user = [
    `Vertical: ${input.brandName} (${input.verticalId})`,
    `Contrast line (use on packaging/resilience content): ${input.contrastLine}`,
    `Tagline: ${input.tagline}`,
    `Post type: ${input.postType}`,
    `Board URL: ${input.boardUrl}`,
    `Sponsor URL (employer CTA only): ${input.sponsorUrl}`,
    statsBlock,
    jobBlock,
    "",
    "Recent X conversation (current events — weave in ONE timely angle naturally; do not quote tweets verbatim or @mention authors):",
    xContext,
    "",
    "Write one LinkedIn post draft that ties a current-events angle to why this specialty board matters.",
    "Include exactly one primary CTA with the board or sponsor URL.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

type GrokApiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

/**
 * Generate a LinkedIn post draft via Grok (xAI).
 * X context is passed in the prompt; Grok synthesizes voice + current-events hook.
 */
export async function generateLinkedInDraft(
  input: GrokDraftInput,
): Promise<GrokDraftResult> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      skipped: true,
      error: "XAI_API_KEY is not configured.",
    };
  }

  const model = grokModel();
  const { system, user } = buildGrokMessages(input);

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const body = (await response.json()) as GrokApiResponse;
    if (!response.ok) {
      return {
        ok: false,
        error: body.error?.message || `Grok API returned ${response.status}`,
      };
    }

    const draft = body.choices?.[0]?.message?.content?.trim();
    if (!draft) {
      return { ok: false, error: "Grok returned an empty draft." };
    }

    return { ok: true, draft, model };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Grok request failed";
    return { ok: false, error: message };
  }
}
