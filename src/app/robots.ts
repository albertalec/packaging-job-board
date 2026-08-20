import type { MetadataRoute } from "next";
import { getRequestTenant, requestHostAndProto } from "@/lib/tenant";
import { requestOrigin } from "@config/tenants";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await getRequestTenant();
  const { hostHeader, proto } = await requestHostAndProto();
  const origin = requestOrigin({ hostHeader, proto });
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${origin}/sitemap.xml`,
    host: tenant.canonicalHost,
  };
}
