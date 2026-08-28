export type XTweet = {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  url: string;
};

export type XSearchResult =
  | {
      ok: true;
      query: string;
      tweets: XTweet[];
      /** Tweets returned by X before any local filtering. */
      rawCount: number;
    }
  | { ok: false; skipped?: boolean; error: string; query: string };

export function xConfigured(): boolean {
  return Boolean(process.env.X_BEARER_TOKEN?.trim());
}

/** Primary + fallback queries (broaden if the niche query is too quiet). */
export function xSearchQueries(verticalId: string): string[] {
  switch (verticalId) {
    case "packaging":
      return [
        '("packaging engineer" OR "package development" OR "CPG packaging") -is:retweet lang:en',
        "packaging engineer -is:retweet lang:en",
        "(sustainable packaging OR packaging jobs) -is:retweet lang:en",
      ];
    case "businesscontinuity":
      return [
        '("business continuity" OR BCM OR "disaster recovery") -is:retweet lang:en',
        "business continuity hiring -is:retweet lang:en",
        "(BCM OR disaster recovery) jobs -is:retweet lang:en",
      ];
    default:
      return [`"${verticalId}" jobs -is:retweet lang:en`];
  }
}

/** @deprecated Use first query from {@link xSearchQueries}. */
export function xSearchQuery(verticalId: string): string {
  return xSearchQueries(verticalId)[0];
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
  errors?: Array<{ message?: string; title?: string }>;
  title?: string;
  detail?: string;
  reason?: string;
};

function parseXError(body: XApiResponse, status: number, statusText: string): string {
  const parts = [
    body.errors?.[0]?.message,
    body.detail,
    body.title,
    body.reason,
    body.errors?.[0]?.title,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(" — ");
  return `X API returned ${status} ${statusText}`;
}

async function fetchRecentForQuery(input: {
  query: string;
  token: string;
  maxResults: number;
}): Promise<{ tweets: XTweet[]; error?: string }> {
  const maxResults = Math.min(Math.max(input.maxResults, 10), 100);
  const params = new URLSearchParams({
    query: input.query,
    max_results: String(maxResults),
    "tweet.fields": "created_at,author_id",
  });

  const response = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params}`,
    {
      headers: { Authorization: `Bearer ${input.token}` },
    },
  );

  const body = (await response.json()) as XApiResponse;
  if (!response.ok) {
    return { tweets: [], error: parseXError(body, response.status, response.statusText) };
  }

  const tweets: XTweet[] = (body.data ?? []).map((tweet) => ({
    id: tweet.id,
    text: tweet.text.trim(),
    authorId: tweet.author_id ?? "unknown",
    createdAt: tweet.created_at ?? "",
    url: tweetUrl(tweet.id),
  }));

  return { tweets };
}

/**
 * Fetch recent X posts for a vertical's specialty topics.
 * Requires X API v2 recent search (Basic tier or higher).
 */
export async function searchRecentPosts(input: {
  verticalId: string;
  maxResults?: number;
}): Promise<XSearchResult> {
  const queries = xSearchQueries(input.verticalId);
  const token = process.env.X_BEARER_TOKEN?.trim();

  if (!token) {
    return {
      ok: false,
      skipped: true,
      error: "X_BEARER_TOKEN is not configured.",
      query: queries[0],
    };
  }

  const maxResults = input.maxResults ?? 10;
  let lastError: string | undefined;

  for (const query of queries) {
    try {
      const result = await fetchRecentForQuery({
        query,
        token,
        maxResults,
      });

      if (result.error) {
        lastError = result.error;
        console.info(`[social/x] search failed for "${query}": ${result.error}`);
        continue;
      }

      if (result.tweets.length > 0) {
        return {
          ok: true,
          query,
          tweets: result.tweets,
          rawCount: result.tweets.length,
        };
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "X search request failed";
      console.info(`[social/x] search error for "${query}": ${lastError}`);
    }
  }

  if (lastError) {
    return { ok: false, error: lastError, query: queries[0] };
  }

  return {
    ok: true,
    query: queries[queries.length - 1],
    tweets: [],
    rawCount: 0,
  };
}

export function describeXSearchResult(
  result: XSearchResult,
  usedCount = 0,
  verticalId?: string,
): string {
  if (!result.ok) {
    if (result.skipped) return "X search skipped (X_BEARER_TOKEN not set).";
    return `X search failed: ${result.error}`;
  }
  if (result.rawCount === 0) {
    const tried = verticalId ? xSearchQueries(verticalId).length : 1;
    return `X search returned 0 posts (tried ${tried} queries). Last query: ${result.query}`;
  }
  if (usedCount === 0) {
    return `X search: ${result.rawCount} post(s) via "${result.query}"`;
  }
  return `X search: ${result.rawCount} post(s); ${usedCount} new after filtering reused themes`;
}
