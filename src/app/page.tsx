import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobBoard } from "@/components/JobBoard";
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
  const sortedJobs = sortJobsWithSponsors(jobs, sponsoredIds);
  const employersHiring = new Set(jobs.map((job) => job.company)).size;
  const ingestedLabel = ingestedAt
    ? new Date(ingestedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "not yet run";

  return (
    <>
      <section className="hero">
        <p className="kicker">{tenant.copy.kicker}</p>
        <h1>{tenant.copy.hero}</h1>
        <p className="lede">{tenant.copy.lede}</p>
        <dl className="stats">
          <div>
            <dt>Live roles</dt>
            <dd>{total}</dd>
          </div>
          <div>
            <dt>Employers hiring</dt>
            <dd>{employersHiring}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{ingestedLabel}</dd>
          </div>
        </dl>
      </section>
      <JobBoard
        jobs={sortedJobs}
        sponsoredIds={[...sponsoredIds]}
        empty={tenant.copy.empty}
        emptyFiltered={tenant.copy.emptyFiltered}
      />
    </>
  );
}
