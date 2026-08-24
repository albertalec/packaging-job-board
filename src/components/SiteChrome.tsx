"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HubLogoLockup } from "./LogoMark";
import { useTenant } from "./TenantProvider";

const NETWORK_NAME = "Niche Board";

function NetworkCredit({
  credit,
  href,
}: {
  credit: string;
  href: string | null;
}) {
  if (!href) return credit;
  const at = credit.lastIndexOf(NETWORK_NAME);
  if (at < 0) {
    return (
      <a className="network-link" href={href}>
        {credit}
      </a>
    );
  }
  return (
    <>
      {credit.slice(0, at)}
      <a className="network-link" href={href}>
        {NETWORK_NAME}
      </a>
      {credit.slice(at + NETWORK_NAME.length)}
    </>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const pathname = usePathname();
  const employer = pathname.startsWith("/sponsor") || pathname.startsWith("/employers");
  const hub = tenant.kind === "hub";

  return (
    <>
      <header className="mast">
        <Link href="/" className="mark">
          {hub ? (
            <HubLogoLockup
              markLine1={tenant.brand.markLine1}
              markLine2={tenant.brand.markLine2}
              tagline={tenant.brand.tagline}
            />
          ) : (
            <>
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
            </>
          )}
        </Link>
        <div className="mast-links">
          {!hub ? (
            <p className="tagline">
              {employer ? tenant.brand.employerTagline : tenant.brand.tagline}
            </p>
          ) : null}
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
            {tenant.brand.name},{" "}
            <NetworkCredit
              credit={tenant.brand.networkCredit}
              href={tenant.hubOrigin}
            />
          </p>
        ) : null}
        <p>{employer ? tenant.brand.employerFooter : tenant.brand.footer}</p>
      </footer>
    </>
  );
}
