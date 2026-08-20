import type { MetadataRoute } from "next";
import { getRequestTenant } from "@/lib/tenant";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await getRequestTenant();
  const origin = `https://${tenant.canonicalHost}`;

  if (tenant.kind === "hub") {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: `${origin}/sitemap.xml`,
      host: tenant.canonicalHost,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sponsor", "/sponsor/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: tenant.canonicalHost,
  };
}
