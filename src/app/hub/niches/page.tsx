import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verticals } from "@config/tenants";
import { loadJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { getRequestTenant, verticalPublicOrigin } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  return buildPageMetadata({
    tenant,
    title: "Niches",
    description:
      "Specialist job boards on Niche Board. Only live verticals with inventory are listed.",
    path: "/niches",
  });
}

const UPCOMING = [
  {
    name: "Supply Chain Jobs",
    note: "Demand planning and S&OP — not warehouse ops. Coming after packaging sponsor renewals.",
  },
  {
    name: "Resilience Jobs",
    note: "BCM and disaster recovery — not generic IT. Phase 3.",
  },
];

export default async function NichesPage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "hub") notFound();

  const live = await Promise.all(
    verticals.map(async (vertical) => {
      const jobs = loadJobs(vertical.id);
      return {
        id: vertical.id,
        name: vertical.brand.name,
        tagline: vertical.brand.tagline,
        contrast: vertical.copy.contrast,
        total: jobs.total,
        href: await verticalPublicOrigin(vertical.id),
      };
    }),
  );

  return (
    <article className="sponsor-page">
      <p className="kicker">Verticals</p>
      <h1>Boards too narrow for LinkedIn</h1>
      <p className="lede">
        Each subdomain is its own specialty board — its own classifier, filters,
        and sponsorship pool — on Niche Board. We only launch a niche once it
        has enough on-target roles.
      </p>
      <h2 className="sponsor-subhead">Live</h2>
      <ul className="niche-grid">
        {live.map((board) => (
          <li key={board.id}>
            <a className="niche-card" href={board.href}>
              <span className="pick-title">{board.name}</span>
              <span className="pick-meta">
                {board.contrast} · {board.total} live roles
              </span>
            </a>
          </li>
        ))}
      </ul>
      <h2 className="sponsor-subhead">Next</h2>
      <ul className="niche-grid">
        {UPCOMING.map((board) => (
          <li key={board.name}>
            <div className="niche-card coming-soon">
              <span className="pick-title">{board.name}</span>
              <span className="pick-meta">{board.note}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
