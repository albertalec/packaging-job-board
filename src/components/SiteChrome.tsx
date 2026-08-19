"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";

export function SiteChrome({ children }: { children: ReactNode }) {
  const employer = usePathname().startsWith("/sponsor");

  return (
    <>
      <header className="mast">
        <Link href="/" className="mark">
          <span className="box" aria-hidden="true" />
          <span>
            {brand.markLine1}
            {brand.markLine2 ? (
              <>
                <br />
                {brand.markLine2}
              </>
            ) : null}
          </span>
        </Link>
        <div className="mast-links">
          <p className="tagline">
            {employer
              ? "Pin an existing listing at the top of the board."
              : "Packaging engineer jobs at top employers."}
          </p>
          <Link className="nav-link" href="/sponsor">
            Sponsor a job
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <p>
          {employer
            ? "Pin a live career-site listing. Candidates apply on the employer ATS."
            : "Packaging engineer roles from employer career sites. Apply on the source listing."}
        </p>
      </footer>
    </>
  );
}
