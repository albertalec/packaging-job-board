import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardSponsorPanel } from "@/components/BoardSponsorPanel";
import { JobAlertsSignup } from "@/components/JobAlertsSignup";
import { JobBoard } from "@/components/JobBoard";
import {
  countSectors,
  employerLede,
} from "@/lib/board-stats";
import { loadJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { getActiveSponsoredJobIds, sortJobsWithSponsors } from "@/lib/sponsorships";
import { getRequestTenant } from "@/lib/tenant";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") {
    return buildPageMetadata({
      tenant,
      title: tenant.brand.name,
      description: tenant.copy.metaDescription,
      path: "/",
    });
  }
  return buildPageMetadata({
    tenant,
    title: tenant.copy.hero.replace(/\.$/, ""),
    description: tenant.copy.metaDescription,
    path: "/",
  });
}

export default async function HomePage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const { jobs, ingestedAt, total } = loadJobs(tenant.id);
  const sponsoredIds = await getActiveSponsoredJobIds(tenant.id);
  const sortedJobs = sortJobsWithSponsors(jobs, sponsoredIds, Date.now(), "date", tenant.id);
  const employersHiring = new Set(jobs.map((job) => job.company)).size;
  const sectors = countSectors(jobs);
  const ingestedLabel = ingestedAt
    ? new Date(ingestedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "not yet run";

  return (
    <div className="board-shell">
      <section className="board-hero">
        <div className="board-hero-copy">
          <p className="board-eyebrow">
            {tenant.copy.kicker} · {ingestedLabel}
          </p>
          <h1>{tenant.copy.hero}</h1>
          <p className="board-contrast">{tenant.copy.contrast}</p>
          <p className="lede">{employerLede(jobs)}</p>
          <div className="board-stats" aria-label="Board stats">
            <div className="board-stat">
              <span className="board-stat-value">{total}</span>
              <span className="board-stat-label">live roles</span>
            </div>
            <div className="board-stat">
              <span className="board-stat-value">{employersHiring}</span>
              <span className="board-stat-label">employers</span>
            </div>
            <div className="board-stat">
              <span className="board-stat-value">{sectors}</span>
              <span className="board-stat-label">sectors</span>
            </div>
          </div>
        </div>
        {tenant.copy.boardSpecParagraphs && tenant.copy.boardSpecTitle ? (
          <aside
            className="board-spec-panel"
            aria-label={tenant.copy.boardSpecTitle}
          >
            <p className="board-spec-kicker">{tenant.copy.boardSpecTitle}</p>
            <div className="board-spec-body">
              {tenant.copy.boardSpecParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </aside>
        ) : null}
      </section>

      <JobBoard
        jobs={sortedJobs}
        sponsoredIds={[...sponsoredIds]}
        empty={tenant.copy.empty}
        emptyFiltered={tenant.copy.emptyFiltered}
      />

      <JobAlertsSignup
        title={tenant.copy.alertsTitle}
        lede={tenant.copy.alertsLede}
      />

      <BoardSponsorPanel
        title={tenant.copy.sponsorPanelTitle}
        priceCents={tenant.sponsor.priceCents}
        durationDays={tenant.sponsor.durationDays}
      />
    </div>
  );
}
