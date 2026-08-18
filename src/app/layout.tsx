import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Packaging Job Board",
    template: "%s · Packaging Job Board",
  },
  description:
    "Brand-side CPG packaging R&D and packaging engineer roles, ingested from employer ATS feeds. Apply on the source career site.",
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
          <header className="mast">
            <Link href="/" className="mark">
              <span className="box" aria-hidden="true" />
              <span>
                Packaging
                <br />
                Job Board
              </span>
            </Link>
            <div className="mast-links">
              <p className="tagline">
                CPG packaging R&amp;D. Engineers, not plant oilers.
              </p>
              <Link className="nav-link" href="/sponsor">
                Sponsor a job
              </Link>
            </div>
          </header>
          <main>{children}</main>
          <footer>
            <p>
              Packaging engineer and package-development roles from employer
              career-site APIs. Applications stay on the source ATS. LinkedIn is
              not scraped. This is not a dump of every job at a converter.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
