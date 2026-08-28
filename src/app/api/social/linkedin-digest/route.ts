import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/alerts";
import {
  digestSummary,
  runLinkedInDraftDigest,
} from "@/lib/social/digest";
import { socialConfigStatus } from "@/lib/social/linkedin";
import { socialDraftEmailConfigured } from "@/lib/social/mail";
import type { LinkedInPostType } from "@/lib/social/linkedin";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  const vertical = url.searchParams.get("vertical") ?? undefined;
  const postTypeParam = url.searchParams.get("postType");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const cronDayOnly = url.searchParams.get("cronDayOnly") === "true";

  const postType =
    postTypeParam && POST_TYPES.has(postTypeParam as LinkedInPostType)
      ? (postTypeParam as LinkedInPostType)
      : undefined;

  const result = await runLinkedInDraftDigest({
    verticalId: vertical,
    postType,
    dryRun,
    cronDayOnly,
  });

  const summary = digestSummary(result);

  return NextResponse.json({
    ok: summary.emailed > 0 || (dryRun && summary.generated > 0),
    config: {
      ...socialConfigStatus(),
      email: socialDraftEmailConfigured(),
      recipients: result.recipients,
    },
    postType: result.postType,
    summary,
    items: result.items,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
