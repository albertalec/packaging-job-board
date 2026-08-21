import { NextResponse } from "next/server";
import { subscribeToAlerts } from "@/lib/alerts";
import { originFromRequest, tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  niche?: string;
  state?: string;
  website?: string;
};

export async function POST(request: Request) {
  try {
    let tenant;
    try {
      tenant = tenantFromRequest(request);
    } catch {
      return NextResponse.json({ error: "Unknown host" }, { status: 404 });
    }

    if (tenant.kind !== "vertical") {
      return NextResponse.json(
        { error: "Job alerts are available on specialist boards." },
        { status: 400 },
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Honeypot — bots fill hidden "website" fields.
    if (body.website?.trim()) {
      return NextResponse.json({ ok: true, status: "subscribed" });
    }

    const result = await subscribeToAlerts({
      verticalId: tenant.id,
      email: body.email ?? "",
      niche: body.niche,
      state: body.state,
      origin: originFromRequest(request),
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      email: result.email,
    });
  } catch (error) {
    console.error("[alerts/subscribe]", error);
    const message =
      error instanceof Error ? error.message : "Could not subscribe. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
