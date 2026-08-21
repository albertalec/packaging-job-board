import { hub } from "./hub";
import { packaging } from "./packaging";
import type { Tenant, TenantEnv, VerticalTenant } from "./types";

export type { Tenant, TenantEnv, VerticalTenant } from "./types";
export { hub, packaging };

export const verticals: VerticalTenant[] = [packaging];

export const tenants: Tenant[] = [hub, ...verticals];

const tenantsById = new Map<string, Tenant>(
  tenants.map((tenant) => [tenant.id, tenant]),
);

export function getTenant(id: string): Tenant {
  const tenant = tenantsById.get(id);
  if (!tenant) {
    throw new Error(`Unknown tenant: ${id}`);
  }
  return tenant;
}

export function getVertical(id: string): VerticalTenant {
  const tenant = getTenant(id);
  if (tenant.kind !== "vertical") {
    throw new Error(`Not a vertical tenant: ${id}`);
  }
  return tenant;
}

export function listVerticalIds(): string[] {
  return verticals.map((vertical) => vertical.id);
}

export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) return `$${dollars}`;
  return `$${dollars.toFixed(2)}`;
}

export function normalizeHost(hostHeader: string | null | undefined): string {
  if (!hostHeader) return "";
  const host = hostHeader.trim().split(",")[0]?.trim() ?? "";
  return host.replace(/^\s+/, "").split(":")[0]?.toLowerCase() ?? "";
}

export function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost")
  );
}

export function isPreviewHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

export function resolveTenantId(
  hostHeader: string | null | undefined,
  env: TenantEnv = {},
): string | null {
  const override = env.TENANT_HOST?.trim();
  const hostname = normalizeHost(override || hostHeader);

  if (!hostname) {
    return env.DEFAULT_VERTICAL?.trim() || packaging.id;
  }

  for (const tenant of tenants) {
    if (tenant.hosts.includes(hostname)) return tenant.id;
  }

  if (isLocalHost(hostname) || isPreviewHost(hostname)) {
    return env.DEFAULT_VERTICAL?.trim() || packaging.id;
  }

  return null;
}

export type PublicOriginInput = {
  hostHeader: string | null | undefined;
  proto?: string | null;
};

/** Canonical public origin for a tenant, using .localhost in local/dev. */
export function tenantOrigin(
  tenant: Tenant,
  input: PublicOriginInput,
): string {
  const hostname = normalizeHost(input.hostHeader);
  const port = portFromHost(input.hostHeader);
  const proto = (input.proto ?? "https").replace(/:$/, "");

  if (isLocalHost(hostname)) {
    return `${proto}://${tenant.localHost}${port}`;
  }

  if (isPreviewHost(hostname) && tenant.id === packaging.id) {
    const host = input.hostHeader?.split(",")[0]?.trim() ?? hostname;
    return `${proto}://${host}`;
  }

  return `https://${tenant.canonicalHost}`;
}

export function requestOrigin(input: PublicOriginInput): string {
  const hostname = normalizeHost(input.hostHeader);
  const port = portFromHost(input.hostHeader);
  const proto = (input.proto ?? "https").replace(/:$/, "");
  const host = input.hostHeader?.split(",")[0]?.trim() ?? hostname;
  if (!host) return `http://localhost${port}`;
  if (isLocalHost(hostname)) return `${proto}://${hostname}${port}`;
  return `${proto}://${host}`;
}

function portFromHost(hostHeader: string | null | undefined): string {
  if (!hostHeader) return "";
  const host = hostHeader.trim().split(",")[0]?.trim() ?? "";
  const idx = host.lastIndexOf(":");
  if (idx <= 0) return "";
  const maybePort = host.slice(idx + 1);
  if (/^\d+$/.test(maybePort)) return `:${maybePort}`;
  return "";
}
