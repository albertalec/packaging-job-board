import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { BoardSkinSync } from "@/components/BoardSkinSync";
import { SiteChrome } from "@/components/SiteChrome";
import { TenantProvider } from "@/components/TenantProvider";
import {
  getRequestTenant,
  requestHostAndProto,
  themeStyle,
  toPublicTenant,
} from "@/lib/tenant";
import { requestOrigin } from "@config/tenants";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  const { hostHeader, proto } = await requestHostAndProto();
  const origin = requestOrigin({ hostHeader, proto });
  const canonical = `https://${tenant.canonicalHost}`;
  const verification = googleSiteVerification(tenant.id);

  return {
    metadataBase: new URL(origin),
    title: {
      default: tenant.brand.name,
      template: `%s · ${tenant.brand.name}`,
    },
    description: tenant.copy.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      siteName: tenant.brand.name,
      title: tenant.brand.name,
      description: tenant.copy.metaDescription,
      url: canonical,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: tenant.brand.name,
      description: tenant.copy.metaDescription,
    },
    ...(verification
      ? { verification: { google: verification } }
      : {}),
  };
}

/** Per-tenant Google Search Console HTML-tag tokens (content= value only). */
function googleSiteVerification(tenantId: string): string | undefined {
  const fromEnv = (value: string | undefined) => normalizeVerificationToken(value);

  if (tenantId === "packaging") {
    return (
      fromEnv(process.env.GOOGLE_SITE_VERIFICATION_PACKAGING) ||
      fromEnv(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_PACKAGING) ||
      // Public meta token for packaging.nicheboardjobs.com (HTML tag verify).
      "b1Ejt9D03qRU4J5VjoW9iQOJuHYwW8n-P21JO7hcF-s"
    );
  }
  if (tenantId === "hub") {
    return (
      fromEnv(process.env.GOOGLE_SITE_VERIFICATION_HUB) ||
      fromEnv(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_HUB)
    );
  }
  return (
    fromEnv(process.env.GOOGLE_SITE_VERIFICATION) ||
    fromEnv(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)
  );
}

function normalizeVerificationToken(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^google-site-verification=/i, "");
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tenant = await getRequestTenant();
  const publicTenant = await toPublicTenant(tenant);
  const theme = themeStyle(tenant);

  return (
    <html
      lang="en"
      data-vertical={tenant.id}
      {...(tenant.id === "packaging" ? { "data-board-skin": "standard" } : {})}
      style={theme as CSSProperties}
    >
      <body>
        {tenant.id === "packaging" ? <BoardSkinSync /> : null}
        <div className="sheet">
          <TenantProvider tenant={publicTenant}>
            <SiteChrome>{children}</SiteChrome>
          </TenantProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
