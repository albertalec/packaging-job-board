import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verticals } from "@config/tenants";
import { loadJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { getRequestTenant, verticalPublicOrigin } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const UPCOMING = [
  {
    label: "Supply chain",
    note: "Demand planning & S&OP — not warehouse ops.",
  },
  {
    label: "Resilience",
    note: "BCM & disaster recovery — not generic IT.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  return buildPageMetadata({
    tenant,
    title: "Niche Board",
    description: tenant.copy.metaDescription,
    path: "/",
  });
}

export default async function HubHomePage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "hub") notFound();

  const live = await Promise.all(
    verticals.map(async (vertical) => {
      const jobs = loadJobs(vertical.id);
      return {
        id: vertical.id,
        label: vertical.brand.hubLabel ?? vertical.brand.markLine1,
        tagline: vertical.copy.contrast,
        total: jobs.total,
        href: await verticalPublicOrigin(vertical.id),
      };
    }),
  );

  return (
    <>
      <section className="hero hub-hero">
        <p className="hub-hero-badge">
          <span>1 board live</span>
          <span className="hub-hero-badge-sep" aria-hidden="true">
            ·
          </span>
          <span className="hub-hero-badge-accent">more coming</span>
        </p>
        <p className="hub-hero-tagline">{tenant.brand.tagline}</p>
        <h1>{tenant.copy.hero}</h1>
        <p className="lede">{tenant.copy.lede}</p>
        <div className="sponsor-actions hub-hero-actions">
          <Link className="apply big hub-cta-primary" href="/niches">
            Browse live boards
          </Link>
          <Link className="ghost big hub-cta-employer" href="/employers">
            For employers
          </Link>
        </div>
        <p className="hub-audience-split">
          <strong>Looking for roles?</strong> Browse a board below.{" "}
          <strong className="hub-text-amber">Hiring?</strong> Pin a listing you
          already have.
        </p>
      </section>

      {tenant.copy.pillars && tenant.copy.pillars.length > 0 ? (
        <section className="hub-pillars" aria-label="Why Niche Board">
          <ul className="hub-pillars-list">
            {tenant.copy.pillars.map((pillar) => (
              <li
                key={pillar.title}
                className={`hub-pillar hub-pillar-${pillar.accent ?? "navy"}`}
              >
                <span className="hub-pillar-mark" aria-hidden="true" />
                <span className="hub-pillar-title">{pillar.title}</span>
                <span className="hub-pillar-body">{pillar.body}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="hub-boards-band">
        <h2 className="hub-section-head">
          {tenant.copy.boardsHeadline ?? "Live boards"}
        </h2>
        {tenant.copy.boardsIntro ? (
          <p className="hub-section-intro">{tenant.copy.boardsIntro}</p>
        ) : null}
        <h3 className="hub-section-label">Live</h3>
        <ul className="niche-grid">
          {live.map((board) => (
            <li key={board.id}>
              <a className="niche-card niche-card-live" href={board.href}>
                <span className="hub-badge hub-badge-live">Live</span>
                <span className="niche-card-main">
                  <span className="pick-title">{board.label}</span>
                  <span className="pick-contrast">{board.tagline}</span>
                  <span className="pick-meta">
                    {board.total} roles · Updated daily
                  </span>
                </span>
                <span className="niche-card-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
        <h3 className="hub-section-label hub-section-label-muted">Coming next</h3>
        <ul className="niche-grid hub-board-grid-soon">
          {UPCOMING.map((board) => (
            <li key={board.label}>
              <div className="niche-card coming-soon">
                <span className="hub-badge hub-badge-soon">Soon</span>
                <span className="niche-card-main">
                  <span className="pick-title">{board.label}</span>
                  <span className="pick-meta">{board.note}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
