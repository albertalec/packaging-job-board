import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/alerts";
import {
  generateLinkedInPostDraft,
  socialConfigStatus,
  type LinkedInPostType,
} from "@/lib/social/linkedin";
import { listVerticalIds } from "@config/tenants";

export const runtime = "nodejs";
export const maxDuration = 60;

const POST_TYPES = new Set<LinkedInPostType>([
  "current-events",
  "contrast",
  "fresh-role",
  "proof",
  "employer",
]);

async function handle(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const verticalParam = url.searchParams.get("vertical");
  const postTypeParam = url.searchParams.get("postType");
  const dryRun =
    url.searchParams.get("dryRun") === "true" ||
    process.env.SOCIAL_DRY_RUN === "true";
  const includeRecent = url.searchParams.get("recent") === "true";

  const postType =
    postTypeParam && POST_TYPES.has(postTypeParam as LinkedInPostType)
      ? (postTypeParam as LinkedInPostType)
      : undefined;

  const verticals = verticalParam ? [verticalParam] : listVerticalIds();
  const results = [];

  for (const verticalId of verticals) {
    results.push(
      await generateLinkedInPostDraft({
        verticalId,
        postType,
        dryRun,
        includeRecent,
      }),
    );
  }

  return NextResponse.json({
    ok: results.every((result) => result.ok || result.skipped),
    config: socialConfigStatus(),
    results,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
