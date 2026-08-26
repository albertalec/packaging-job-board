import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyLink } from "@/components/ApplyLink";
import { JobAlertsSignup } from "@/components/JobAlertsSignup";
import { listingRail, postedLabel } from "@/components/JobCard";
import { JobDescription } from "@/components/JobDescription";
import { JsonLd } from "@/components/JsonLd";
import { parseJobDescription, splitEmployerAbout } from "@/lib/description";
import { getJob, loadJobs, relatedJobs } from "@/lib/jobs";
import { formatNiche } from "@/lib/niches";
import { absoluteUrl, buildJobPostingJsonLd, buildPageMetadata } from "@/lib/seo";
import {
  getActiveSponsoredJobIds,
  getSponsorshipForJob,
} from "@/lib/sponsorships";
import { formatUsd, getRequestTenant } from "@/lib/tenant";

export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return loadJobs("packaging").jobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") return { title: "Job not found" };
  const { id } = await params;
  const job = getJob(id, tenant.id);
  if (!job) return { title: "Job not found", robots: { index: false } };
  return buildPageMetadata({
    tenant,
    title: `${job.title} at ${job.company}`,
    description: `${job.title} — ${job.location}. Apply on the employer ATS.`,
    path: `/jobs/${job.id}`,
  });
}

export default async function JobPage({ params }: Params) {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const { id } = await params;
  const catalog = loadJobs(tenant.id);
  const job = catalog.jobs.find((item) => item.id === id);
  if (!job) notFound();

  const sponsorship = await getSponsorshipForJob(job.id, tenant.id);
  const sponsoredIds = await getActiveSponsoredJobIds(tenant.id);
  const related = relatedJobs(catalog.jobs, job);
  const { about, rest } = splitEmployerAbout(parseJobDescription(job.description));
  const niche = formatNiche(job.niche);
  const posted = postedLabel(job.postedAt);
  const price = formatUsd(tenant.sponsor.priceCents);
  const duration =
    tenant.sponsor.durationDays === 30
      ? "thirty"
      : String(tenant.sponsor.durationDays);
  const boardLabel = (tenant.brand.hubLabel ?? tenant.brand.markLine1).toLowerCase();
  const pageUrl = await absoluteUrl(tenant, `/jobs/${job.id}`);
  const jsonLd = buildJobPostingJsonLd(job, pageUrl);

  return (
    <article className="board-shell job-page">
      <JsonLd data={jsonLd} />
      <p className="job-crumb">
        <Link href="/">All roles</Link> / {job.company}
      </p>
      <header className="job-hero">
        <div className="job-hero-copy">
          <div className="job-hero-byline">
            <p className="job-company">{job.company}</p>
            {niche ? <span className="job-sector">{niche}</span> : null}
            {sponsorship ? (
              <span className="job-tag job-tag-pinned">Pinned</span>
            ) : null}
          </div>
          <h1>{job.title}</h1>
          <dl className="job-facts">
            {job.salary ? (
              <div>
                <dt>Salary</dt>
                <dd>{job.salary}</dd>
              </div>
            ) : null}
            <div>
              <dt>Location</dt>
              <dd>{job.location}</dd>
            </div>
            {posted ? (
              <div>
                <dt>Posted</dt>
                <dd className="is-posted">{posted}</dd>
              </div>
            ) : null}
          </dl>
          <ApplyLink
            className="board-btn board-btn-primary job-apply-btn"
            href={job.applyUrl}
            company={job.company}
          >
            Apply on {job.company} careers →
          </ApplyLink>
        </div>
      </header>
      <div className="job-layout">
        <div className="job-main">
          <JobDescription blocks={rest} />
          <aside className="job-employer" aria-label={`About ${job.company}`}>
            <p className="job-employer-kicker">About {job.company}</p>
            {about.length > 0 ? (
              about.map((block, index) =>
                block.type === "list" ? (
                  <ul key={index} className="job-employer-list">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                ) : block.type === "paragraph" ? (
                  <p key={index} className="job-employer-body">
                    {block.text}
                  </p>
                ) : null,
              )
            ) : (
              <p className="job-employer-body">
                Full boilerplate, benefits detail and equal-opportunity statements
                live on the source listing.
              </p>
            )}
            <ApplyLink
              className="job-employer-link"
              href={job.applyUrl}
              company={job.company}
            >
              Read the full posting on {job.company} careers →
            </ApplyLink>
          </aside>
        </div>
        <aside className="job-aside">
          {related.length > 0 ? (
            <div className="job-related">
              <p className="job-related-kicker">More on this board</p>
              <ul className="job-related-list">
                {related.map((item, index) => {
                  const rail = listingRail(
                    item.postedAt,
                    sponsoredIds.has(item.id),
                  );
                  const cardClass =
                    rail === "pinned"
                      ? "job-related-card job-related-card-pinned"
                      : rail === "new"
                        ? "job-related-card job-related-card-new"
                        : "job-related-card";
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/jobs/${item.id}`}
                        className={`${cardClass}${index > 0 ? " is-stacked" : ""}`}
                      >
                        <span className="job-related-company">{item.company}</span>
                        <span className="job-related-title">{item.title}</span>
                        <span className="job-related-meta">{item.location}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link className="job-related-all" href="/">
                All {catalog.total} {boardLabel} roles →
              </Link>
            </div>
          ) : null}
          <JobAlertsSignup
            compact
            defaultNiche={job.niche ?? ""}
            title="Get roles like this"
            lede="A short digest when new package-development jobs land. Nothing on a slow week."
          />
        </aside>
      </div>
      <div className="job-sponsor-strip">
        <p>
          Hiring for a role like this? Pin your own listing to this board —{" "}
          {price} for {duration} days.
        </p>
        <Link href="/sponsor">Sponsor a listing →</Link>
      </div>
    </article>
  );
}
