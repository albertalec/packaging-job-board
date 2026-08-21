import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getTenant,
  resolveTenantId,
  tenantOrigin,
} from "@config/tenants";

function env() {
  return {
    TENANT_HOST: process.env.TENANT_HOST,
    DEFAULT_VERTICAL: process.env.DEFAULT_VERTICAL,
  };
}

function incomingHost(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}

function incomingProto(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "") ??
    "https"
  );
}

function withTenantHeaders(
  request: NextRequest,
  tenantId: string,
  hostHeader: string | null,
) {
  const tenant = getTenant(tenantId);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", tenant.id);
  requestHeaders.set("x-tenant-host", hostHeader ?? tenant.canonicalHost);
  return requestHeaders;
}

export function middleware(request: NextRequest) {
  const hostHeader = incomingHost(request);
  const tenantId = resolveTenantId(hostHeader, env());

  if (!tenantId) {
    return new NextResponse("Unknown host", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const tenant = getTenant(tenantId);
  const requestHeaders = withTenantHeaders(request, tenant.id, hostHeader);
  const { pathname } = request.nextUrl;
  const proto = incomingProto(request);

  if (tenant.kind === "hub") {
    if (
      pathname.startsWith("/jobs") ||
      pathname.startsWith("/sponsor") ||
      pathname.startsWith("/alerts") ||
      pathname.startsWith("/api/checkout") ||
      pathname.startsWith("/api/alerts")
    ) {
      const dest = new URL(
        `${pathname}${request.nextUrl.search}`,
        tenantOrigin(getTenant("packaging"), { hostHeader, proto }),
      );
      return NextResponse.redirect(dest);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/hub";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    if (pathname === "/niches" || pathname === "/employers") {
      const url = request.nextUrl.clone();
      url.pathname = `/hub${pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (
    pathname === "/hub" ||
    pathname.startsWith("/hub/") ||
    pathname === "/niches" ||
    pathname === "/employers"
  ) {
    const destPath = pathname.startsWith("/hub")
      ? pathname.slice("/hub".length) || "/"
      : pathname;
    const dest = new URL(
      destPath,
      tenantOrigin(getTenant("hub"), { hostHeader, proto }),
    );
    return NextResponse.redirect(dest);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt)$).*)",
  ],
};
