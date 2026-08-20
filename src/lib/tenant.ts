import { headers } from "next/headers";
import {
  formatUsd,
  getTenant,
  getVertical,
  requestOrigin,
  resolveTenantId,
  tenantOrigin,
  type Tenant,
  type VerticalTenant,
} from "@config/tenants";

export type { Tenant, VerticalTenant };
export { formatUsd, getTenant, getVertical, tenantOrigin };

export type PublicTenant = {
  id: string;
  kind: Tenant["kind"];
  brand: Tenant["brand"];
  contactEmail: string;
  origin: string;
  sponsor: VerticalTenant["sponsor"] | null;
};

function headerEnv() {
  return {
    TENANT_HOST: process.env.TENANT_HOST,
    DEFAULT_VERTICAL: process.env.DEFAULT_VERTICAL,
  };
}

export async function getRequestTenant(): Promise<Tenant> {
  try {
    const headerStore = await headers();
    const id = headerStore.get("x-tenant");
    if (id) return getTenant(id);
    const host =
      headerStore.get("x-tenant-host") ??
      headerStore.get("x-forwarded-host") ??
      headerStore.get("host");
    const resolved = resolveTenantId(host, headerEnv());
    if (resolved) return getTenant(resolved);
  } catch {
    // headers() is unavailable during some static generation passes.
  }
  return getTenant(process.env.DEFAULT_VERTICAL?.trim() || "packaging");
}

export async function getRequestVertical(): Promise<VerticalTenant> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") {
    throw new Error(`Expected a vertical tenant, got ${tenant.id}`);
  }
  return tenant;
}

export function tenantFromRequest(request: Request): Tenant {
  const id = request.headers.get("x-tenant");
  if (id) return getTenant(id);
  const host =
    request.headers.get("x-tenant-host") ??
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");
  const resolved = resolveTenantId(host, headerEnv());
  if (!resolved) {
    throw new Error("Unknown host");
  }
  return getTenant(resolved);
}

export function originFromRequest(request: Request): string {
  const host =
    request.headers.get("x-tenant-host") ??
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host && !host.includes("localhost") ? "https" : "http");
  return requestOrigin({ hostHeader: host, proto });
}

export async function requestHostAndProto(): Promise<{
  hostHeader: string | null;
  proto: string;
}> {
  try {
    const headerStore = await headers();
    const hostHeader =
      headerStore.get("x-tenant-host") ??
      headerStore.get("x-forwarded-host") ??
      headerStore.get("host");
    const proto =
      headerStore.get("x-forwarded-proto") ??
      (hostHeader && !hostHeader.includes("localhost") ? "https" : "http");
    return { hostHeader, proto };
  } catch {
    return { hostHeader: null, proto: "http" };
  }
}

export async function toPublicTenant(tenant?: Tenant): Promise<PublicTenant> {
  const resolved = tenant ?? (await getRequestTenant());
  const { hostHeader, proto } = await requestHostAndProto();
  return {
    id: resolved.id,
    kind: resolved.kind,
    brand: resolved.brand,
    contactEmail: resolved.contactEmail,
    origin: requestOrigin({ hostHeader, proto }),
    sponsor: resolved.kind === "vertical" ? resolved.sponsor : null,
  };
}

export async function verticalPublicOrigin(verticalId: string): Promise<string> {
  const { hostHeader, proto } = await requestHostAndProto();
  return tenantOrigin(getTenant(verticalId), { hostHeader, proto });
}

export function themeStyle(
  tenant: Tenant,
): Record<"--stamp" | "--kraft" | "--paper", string> {
  return {
    "--stamp": tenant.theme.accent,
    "--kraft": tenant.theme.kraft,
    "--paper": tenant.theme.paper,
  };
}
