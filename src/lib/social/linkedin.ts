import {
  formatUsd,
  getVertical,
  tenantOrigin,
  type VerticalTenant,
} from "@config/tenants";
import { generateLinkedInDraft, grokConfigured } from "./grok";
import { boardStats, pickFreshJob } from "./jobs";
import {
  getUsedJobIds,
  getUsedXTweetIds,
  listRecentDrafts,
  saveDraft,
  type SocialDraftRecord,
} from "./store";
import {
  describeXSearchResult,
  searchRecentPosts,
  xConfigured,
  type XTweet,
} from "./x";

const NETWORK_TAGLINE = "The right jobs, not all the jobs.";

export type LinkedInPostType =
  | "current-events"
  | "contrast"
  | "fresh-role"
  | "proof"
  | "employer";

export type LinkedInDraftRunResult = {
  vertical: string;
  postType: LinkedInPostType;
  ok: boolean;
  skipped?: boolean;
  dryRun?: boolean;
  draft?: string;
  model?: string;
  xQuery?: string;
  xTweets?: XTweet[];
  xStatus?: string;
  job?: { title: string; company: string; url: string; id: string };
  saved?: SocialDraftRecord;
  recentDrafts?: SocialDraftRecord[];
  errors: string[];
};

function boardUrls(tenant: VerticalTenant) {
  const origin = tenantOrigin(tenant, {
    hostHeader: tenant.canonicalHost,
    proto: "https",
  });
  return {
    origin,
    boardUrl: origin,
    sponsorUrl: `${origin}/sponsor`,
  };
}

function filterUnusedTweets(
  tweets: XTweet[],
  usedIds: string[],
): XTweet[] {
  const used = new Set(usedIds);
  return tweets.filter((tweet) => !used.has(tweet.id));
}

export async function generateLinkedInPostDraft(input: {
  verticalId: string;
  postType?: LinkedInPostType;
  /** When true, return draft without persisting to store. */
  dryRun?: boolean;
  includeRecent?: boolean;
}): Promise<LinkedInDraftRunResult> {
  const tenant = getVertical(input.verticalId);
  const postType = input.postType ?? "current-events";
  const urls = boardUrls(tenant);
  const stats = boardStats(tenant.id);
  const errors: string[] = [];

  const [usedTweetIds, usedJobIds] = await Promise.all([
    getUsedXTweetIds(tenant.id),
    getUsedJobIds(tenant.id),
  ]);

  const xResult = await searchRecentPosts({ verticalId: tenant.id });
  const xTweets =
    xResult.ok ? filterUnusedTweets(xResult.tweets, usedTweetIds) : [];
  const xStatus = describeXSearchResult(
    xResult,
    xResult.ok ? xTweets.length : 0,
    tenant.id,
  );

  if (!xResult.ok) {
    if (!xResult.skipped) errors.push(`X: ${xResult.error}`);
  } else if (xResult.rawCount === 0) {
    errors.push(`X: ${xStatus}`);
  } else if (xResult.rawCount > 0 && xTweets.length === 0) {
    errors.push(
      `X: ${xResult.rawCount} post(s) found but all were already used in recent drafts.`,
    );
  }

  const job =
    postType === "fresh-role" || postType === "current-events"
      ? pickFreshJob({
          verticalId: tenant.id,
          origin: urls.origin,
          excludeJobIds: usedJobIds,
        })
      : null;

  if (!grokConfigured()) {
    return {
      vertical: tenant.id,
      postType,
      ok: false,
      skipped: true,
      dryRun: input.dryRun,
      xQuery: xResult.query,
      xTweets,
      xStatus,
      job: job ?? undefined,
      errors: ["Grok: XAI_API_KEY is not configured."],
      recentDrafts: input.includeRecent
        ? await listRecentDrafts(tenant.id)
        : undefined,
    };
  }

  if (!xConfigured() && postType === "current-events") {
    errors.push("X: X_BEARER_TOKEN is not configured — draft will use board context only.");
  }

  const grok = await generateLinkedInDraft({
    verticalId: tenant.id,
    brandName: tenant.brand.name,
    contrastLine: tenant.copy.contrast,
    tagline: tenant.brand.tagline || NETWORK_TAGLINE,
    boardUrl: urls.boardUrl,
    sponsorUrl: urls.sponsorUrl,
    postType,
    xTweets,
    job: job ?? undefined,
    boardStats: stats,
  });

  if (!grok.ok) {
    return {
      vertical: tenant.id,
      postType,
      ok: false,
      skipped: grok.skipped,
      dryRun: input.dryRun,
      xQuery: xResult.query,
      xTweets,
      xStatus,
      job: job ?? undefined,
      errors: [...errors, `Grok: ${grok.error}`],
      recentDrafts: input.includeRecent
        ? await listRecentDrafts(tenant.id)
        : undefined,
    };
  }

  let saved: SocialDraftRecord | undefined;
  if (!input.dryRun) {
    saved = await saveDraft({
      vertical: tenant.id,
      postType,
      draft: grok.draft,
      xTweetIds: xTweets.map((tweet) => tweet.id),
      jobId: job?.id,
    });
  }

  return {
    vertical: tenant.id,
    postType,
    ok: true,
    dryRun: input.dryRun,
    draft: grok.draft,
    model: grok.model,
    xQuery: xResult.query,
    xTweets,
    xStatus,
    job: job ?? undefined,
    saved,
    errors,
    recentDrafts: input.includeRecent
      ? await listRecentDrafts(tenant.id)
      : undefined,
  };
}

/** Human-readable config summary for CLI / API introspection. */
export function socialConfigStatus(): {
  grok: boolean;
  x: boolean;
  model: string;
  dryRunDefault: boolean;
} {
  return {
    grok: grokConfigured(),
    x: xConfigured(),
    model: process.env.GROK_MODEL?.trim() || "grok-3",
    dryRunDefault: process.env.SOCIAL_DRY_RUN === "true",
  };
}

export function employerPriceLine(tenant: VerticalTenant): string {
  return `${formatUsd(tenant.sponsor.priceCents)} / ${tenant.sponsor.durationDays} days`;
}
