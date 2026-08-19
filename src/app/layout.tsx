import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { SiteChrome } from "@/components/SiteChrome";
import { googleSiteVerification } from "@/lib/seo";
import { siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const name = siteName();
const verification = googleSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: name,
    template: `%s · ${name}`,
  },
  description:
    "Packaging engineer and package-development jobs at top employers. Updated daily. Apply on the company career site.",
  ...(verification ? { verification: { google: verification } } : {}),
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        <div className="sheet">
          <SiteChrome>{children}</SiteChrome>
        </div>
      </body>
    </html>
  );
}
