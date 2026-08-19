import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Packaging Job Board",
    template: "%s · Packaging Job Board",
  },
  description:
    "Packaging engineer and package-development jobs at top employers. Updated daily. Apply on the company career site.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="sheet">
          <SiteChrome>{children}</SiteChrome>
        </div>
      </body>
    </html>
  );
}
