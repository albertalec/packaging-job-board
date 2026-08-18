import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://packagingjobs.local"),
  title: {
    default: "Packaging Job Board",
    template: "%s · Packaging Job Board",
  },
  description:
    "Niche job board for packaging engineers and packaging managers, ingested from employer ATS feeds.",
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
            <p className="tagline">Product packaging roles. Fresh ATS inventory.</p>
          </header>
          <main>{children}</main>
          <footer>
            <p>
              Aggregated from employer career-site APIs. Applications stay on
              the source ATS. LinkedIn is not scraped.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
