export type XTweet = {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  url: string;
};

export type XSearchResult =
  | { ok: true; query: string; tweets: XTweet[] }
  | { ok: false; skipped?: boolean; error: string; query: string };

export function xConfigured(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN?.trim());
}

/** Vertical-specific recent-search queries for niche hiring / specialty news. */
export function xSearchQuery(verticalId: string): string {
  switch (verticalId) {
    case "packaging":
      return (
        '("packaging engineer" OR "package development" OR "packaging engineer jobs" OR CPG packaging) ' +
        "-is:retweet -is:reply lang:en"
      );
    case "businesscontinuity":
      return (
        '("business continuity" OR BCM OR "disaster recovery" OR "crisis management") ' +
        "-is:retweet -is:reply lang:en"
      );
    default:
      return `"${verticalId}" jobs -is:retweet lang:en`;
  }
}

function tweetUrl(id: string): string {
  return `https://x.com/i/web/status/${id}`;
}

type XApiResponse = {
  data?: Array<{
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
  }>;
  errors?: Array<{ message?: string }>;
};

/**
 * Fetch recent X posts for a vertical's specialty topics.
 * Requires X API v2 Bearer token (Essential access or higher).
 */
export async function searchRecentPosts(input: {
  verticalId: string;
  maxResults?: number;
}): Promise<XSearchResult> {
  const query = xSearchQuery(input.verticalId);
  const token = process.env.X_BEARER_TOKEN?.trim();

  if (!token) {
    return {
      ok: false,
      skipped: true,
      error: "X_BEARER_TOKEN is not configured.",
      query,
    };
  }

  const maxResults = Math.min(Math.max(input.maxResults ?? 8, 10), 100);
  const params = new URLSearchParams({
    query,
    max_results: String(maxResults),
    "tweet.fields": "created_at,author_id",
  });

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const body = (await response.json()) as XApiResponse;
    if (!response.ok) {
      const message =
        body.errors?.[0]?.message ||
        `X API returned ${response.status} ${response.statusText}`;
      return { ok: false, error: message, query };
    }

    const tweets: XTweet[] = (body.data ?? []).map((tweet) => ({
      id: tweet.id,
      text: tweet.text.trim(),
      authorId: tweet.author_id ?? "unknown",
      createdAt: tweet.created_at ?? "",
      url: tweetUrl(tweet.id),
    }));

    return { ok: true, query, tweets };
  } catch (error) {
    const message = error instanceof Error ? error.message : "X search failed";
    return { ok: false, error: message, query };
  }
}
