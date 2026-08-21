import { NextResponse } from "next/server";
import { cronAuthorized, runAlertDigest } from "@/lib/alerts";
import { getVertical, listVerticalIds, tenantOrigin } from "@config/tenants";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const verticalParam = url.searchParams.get("vertical");
  const verticals = verticalParam
    ? [verticalParam]
    : listVerticalIds();

  const results = [];
  for (const verticalId of verticals) {
    const tenant = getVertical(verticalId);
    const origin = tenantOrigin(tenant, {
      hostHeader: tenant.canonicalHost,
      proto: "https",
    });
    results.push(await runAlertDigest({ verticalId, origin }));
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
