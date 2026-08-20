import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
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
      card: "summary",
      title: tenant.brand.name,
      description: tenant.copy.metaDescription,
    },
  };
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
      style={theme as CSSProperties}
    >
      <body>
        <div className="sheet">
          <TenantProvider tenant={publicTenant}>
            <SiteChrome>{children}</SiteChrome>
          </TenantProvider>
        </div>
        <Analytics domain={tenant.canonicalHost} />
      </body>
    </html>
  );
}
