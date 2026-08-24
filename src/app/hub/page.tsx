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
      const employers = new Set(jobs.jobs.map((job) => job.company)).size;
      return {
        id: vertical.id,
        label: vertical.brand.hubLabel ?? vertical.brand.markLine1,
        tagline: vertical.copy.contrast,
        total: jobs.total,
        employers,
        href: await verticalPublicOrigin(vertical.id),
      };
    }),
  );

  const liveCount = live.length;

  return (
    <>
      <div className="hub-shell">
        <section className="hub-hero">
          <div className="hub-hero-copy">
            <p className="hub-hero-badge">
              <span className="hub-hero-badge-dot" aria-hidden="true" />
              <span>
                {liveCount} board{liveCount === 1 ? "" : "s"} live · more coming
              </span>
            </p>
            <h1>{tenant.copy.hero}</h1>
            <p className="hub-hero-tagline">{tenant.brand.tagline}</p>
            <p className="lede">{tenant.copy.lede}</p>
            <div className="hub-hero-actions">
              <Link className="hub-btn hub-btn-primary" href="/niches">
                Browse live boards
              </Link>
              <Link className="hub-btn hub-btn-ghost" href="/employers">
                For employers
              </Link>
            </div>
          </div>
          <aside className="hub-ways-panel" aria-label="Two ways in">
            <p className="hub-ways-title">Two ways in</p>
            <div className="hub-ways-block">
              <p className="hub-ways-heading">Looking for roles?</p>
              <p className="hub-ways-body">
                Browse the board for your discipline. Nothing else on it.
              </p>
            </div>
            <div className="hub-ways-rule" aria-hidden="true" />
            <div className="hub-ways-block">
              <p className="hub-ways-heading">Hiring?</p>
              <p className="hub-ways-body">
                Pin a listing you already have. No second posting workflow.
              </p>
            </div>
          </aside>
        </section>

        {tenant.copy.pillars && tenant.copy.pillars.length > 0 ? (
          <section className="hub-pillars" aria-label="Why Niche Board">
            <ul className="hub-pillars-list">
              {tenant.copy.pillars.map((pillar, index) => (
                <li key={pillar.title} className="hub-pillar">
                  <span className="hub-pillar-num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hub-pillar-copy">
                    <span className="hub-pillar-title">{pillar.title}</span>
                    <span className="hub-pillar-body">{pillar.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <section className="hub-boards-band">
        <div className="hub-shell">
          <div className="hub-boards-head">
            <div className="hub-boards-intro">
              <h2 className="hub-section-head">
                {tenant.copy.boardsHeadline ?? "Browse a specialty board"}
              </h2>
              {tenant.copy.boardsIntro ? (
                <p className="hub-section-intro">{tenant.copy.boardsIntro}</p>
              ) : null}
            </div>
            <p className="hub-boards-family">Engineering & industry</p>
          </div>

          <ul className="hub-live-list">
            {live.map((board) => (
              <li key={board.id}>
                <a className="hub-live-card" href={board.href}>
                  <span className="hub-live-card-copy">
                    <span className="hub-live-card-title-row">
                      <span className="hub-badge hub-badge-live">Live</span>
                      <span className="hub-live-card-title">{board.label}</span>
                    </span>
                    <span className="hub-live-card-note">{board.tagline}</span>
                  </span>
                  <span className="hub-live-card-meta">
                    <span className="hub-live-card-stats">
                      <span className="hub-live-card-count">{board.total}</span>
                      <span className="hub-live-card-count-label">
                        roles · {board.employers} employers
                      </span>
                    </span>
                    <span className="hub-live-card-cta">Open board →</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <ul className="hub-soon-grid">
            {UPCOMING.map((board) => (
              <li key={board.label}>
                <div className="hub-soon-card">
                  <span className="hub-soon-title-row">
                    <span className="hub-badge hub-badge-soon">Soon</span>
                    <span className="hub-soon-title">{board.label}</span>
                  </span>
                  <span className="hub-soon-note">{board.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
