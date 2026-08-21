import type { Metadata } from "next";
import Link from "next/link";
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
        name: vertical.brand.name,
        tagline: vertical.copy.contrast,
        total: jobs.total,
        href: await verticalPublicOrigin(vertical.id),
      };
    }),
  );

  return (
    <>
      <section className="hero">
        <p className="kicker">A Niche Board network</p>
        <h1>{tenant.copy.hero}</h1>
        <p className="lede">{tenant.copy.lede}</p>
        <div className="sponsor-actions">
          <Link className="apply big" href="/employers">
            For employers
          </Link>
          <Link className="ghost big" href="/niches">
            Browse niches
          </Link>
        </div>
      </section>
      <section>
        <h2 className="sponsor-subhead">Live boards</h2>
        <ul className="niche-grid">
          {live.map((board) => (
            <li key={board.id}>
              <a className="niche-card" href={board.href}>
                <span className="pick-title">{board.name}</span>
                <span className="pick-meta">
                  {board.tagline} · {board.total} live roles
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
