"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./LogoMark";
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
  const employer =
    pathname.startsWith("/sponsor") || pathname.startsWith("/employers");
  const hub = tenant.kind === "hub";
  const onEmployers = pathname.startsWith("/employers");

  return (
    <>
      <header className={hub ? "hub-mast" : "mast"}>
        {hub ? (
          <div className="hub-mast-inner">
            <Link href="/" className="hub-mast-brand">
              <LogoMark className="hub-mast-mark" size={26} variant="reverse" />
              <span className="hub-mast-name">{tenant.brand.name}</span>
            </Link>
            <nav className="hub-mast-nav" aria-label="Primary">
              {onEmployers ? (
                <Link className="hub-mast-link" href="/niches">
                  Boards
                </Link>
              ) : null}
              <Link
                className={`hub-mast-link${onEmployers ? " is-active" : ""}`}
                href="/employers"
              >
                Employers
              </Link>
            </nav>
          </div>
        ) : (
          <>
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
                {employer
                  ? tenant.brand.employerTagline
                  : tenant.brand.tagline}
              </p>
              <nav className="mast-nav">
                <Link className="nav-link" href="/#alerts">
                  Job alerts
                </Link>
                <Link className="nav-link" href="/sponsor">
                  Sponsor a job
                </Link>
              </nav>
            </div>
          </>
        )}
      </header>
      <main>{children}</main>
      <footer className={hub ? "hub-footer" : undefined}>
        {hub ? (
          <div className="hub-footer-inner">
            <div className="hub-footer-brand">
              <LogoMark size={22} />
              <span>{tenant.brand.name}</span>
            </div>
            <p className="hub-footer-tagline">{tenant.brand.tagline}</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </footer>
    </>
  );
}
