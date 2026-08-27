"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoardSkinToggle } from "./BoardSkinToggle";
import { LogoMark } from "./LogoMark";
import { useTenant } from "./TenantProvider";

export function SiteChrome({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const pathname = usePathname();
  const employer =
    pathname.startsWith("/sponsor") || pathname.startsWith("/employers");
  const hub = tenant.kind === "hub";
  const onEmployers = pathname.startsWith("/employers");
  const boardLabel = tenant.brand.hubLabel ?? tenant.brand.markLine1;
  const showSkinToggle =
    tenant.id === "packaging" && !hub && pathname === "/";

  return (
    <>
      <header className={hub ? "hub-mast" : "board-mast"}>
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
          <div className="board-mast-inner">
            <div className="board-mast-brand">
              <Link href="/" className="board-mast-network">
                <LogoMark className="board-mast-mark" size={25} variant="reverse" />
                <span>Niche Board</span>
              </Link>
              <span className="board-mast-rule" aria-hidden="true" />
              <Link href="/" className="board-mast-board">
                {boardLabel}
              </Link>
            </div>
            <nav className="board-mast-nav" aria-label="Primary">
              {showSkinToggle ? <BoardSkinToggle /> : null}
              <Link className="board-mast-link" href="/#alerts">
                Job alerts
              </Link>
              <Link className="board-btn board-btn-amber board-mast-cta" href="/sponsor">
                Sponsor a job
              </Link>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className={hub ? "hub-footer" : "board-footer"}>
        {hub ? (
          <div className="hub-footer-inner">
            <div className="hub-footer-brand">
              <LogoMark size={22} />
              <span>{tenant.brand.name}</span>
            </div>
            <p className="hub-footer-tagline">{tenant.brand.tagline}</p>
          </div>
        ) : (
          <div className="board-footer-inner">
            <div className="board-footer-brand">
              {tenant.hubOrigin ? (
                <Link href={tenant.hubOrigin} className="board-footer-network">
                  <LogoMark size={21} />
                  <span>Niche Board</span>
                </Link>
              ) : (
                <>
                  <LogoMark size={21} />
                  <span>Niche Board</span>
                </>
              )}
              <span className="board-footer-rule" aria-hidden="true" />
              <span className="board-footer-board">{boardLabel}</span>
            </div>
            <p className="board-footer-meta">
              {employer ? tenant.brand.employerFooter : tenant.brand.footer}
            </p>
          </div>
        )}
      </footer>
    </>
  );
}
