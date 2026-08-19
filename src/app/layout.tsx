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
                Packaging engineer jobs at top employers.
              </p>
              <Link className="nav-link" href="/sponsor">
                Sponsor a job
              </Link>
            </div>
          </header>
          <main>{children}</main>
          <footer>
            <p>
              Packaging engineer roles from employer career sites. Apply on the
              source listing.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
