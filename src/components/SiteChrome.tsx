"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenant } from "./TenantProvider";

export function SiteChrome({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const pathname = usePathname();
  const employer = pathname.startsWith("/sponsor") || pathname.startsWith("/employers");
  const hub = tenant.kind === "hub";

  return (
    <>
      <header className="mast">
        <Link href="/" className="mark">
          <span className="box" aria-hidden="true" />
          <span>
            {tenant.brand.markLine1}
            {tenant.brand.markLine2 ? (
              <>
                <br />
                {tenant.brand.markLine2}
              </>
            ) : null}
          </span>
        </Link>
        <div className="mast-links">
          <p className="tagline">
            {employer ? tenant.brand.employerTagline : tenant.brand.tagline}
          </p>
          {hub ? (
            <nav className="mast-nav">
              <Link className="nav-link" href="/niches">
                Niches
              </Link>
              <Link className="nav-link" href="/employers">
                Employers
              </Link>
            </nav>
          ) : (
            <nav className="mast-nav">
              <Link className="nav-link" href="/#alerts">
                Job alerts
              </Link>
              <Link className="nav-link" href="/sponsor">
                Sponsor a job
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer>
        {tenant.brand.networkCredit ? (
          <p className="network-credit">
            {tenant.brand.name}, {tenant.brand.networkCredit}
          </p>
        ) : null}
        <p>{employer ? tenant.brand.employerFooter : tenant.brand.footer}</p>
      </footer>
    </>
  );
}
