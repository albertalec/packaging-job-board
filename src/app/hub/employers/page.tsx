import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { packaging } from "@config/packaging";
import { LogoMark } from "@/components/LogoMark";
import { loadJobs } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo";
import { formatUsd, getRequestTenant, verticalPublicOrigin } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  return buildPageMetadata({
    tenant,
    title: "Employers",
    description:
      "Pin an ATS listing on a Niche Board specialty board. Audience precision — not a slot on a generic job site.",
    path: "/employers",
  });
}

export default async function EmployersPage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "hub") notFound();

  const packagingOrigin = await verticalPublicOrigin("packaging");
  const price = formatUsd(packaging.sponsor.priceCents);
  const packagingLabel = packaging.brand.hubLabel ?? "Packaging";
  const jobs = loadJobs("packaging");
  const employers = new Set(jobs.jobs.map((job) => job.company)).size;
  const duration = packaging.sponsor.durationDays;

  return (
    <div className="hub-shell hub-employers">
      <section className="hub-employers-hero">
        <div className="hub-employers-copy">
          <p className="hub-employers-kicker">For employers</p>
          <h1>Pin the listing you already have.</h1>
          <p className="lede">
            One pin, one board, the audience that actually matches the role.
            Candidates finish on your Workday or Greenhouse — we don&apos;t take
            the application.
          </p>
          <div className="hub-hero-actions">
            <a
              className="hub-btn hub-btn-amber"
              href={`${packagingOrigin}/sponsor`}
            >
              Pin on {packagingLabel} — {price}
            </a>
            <Link className="hub-btn hub-btn-ghost" href="/niches">
              Browse live boards
            </Link>
          </div>
        </div>
        <aside className="hub-price-panel" aria-label="Pricing">
          <p className="hub-price-kicker">One pin</p>
          <p className="hub-price-amount">{price}</p>
          <p className="hub-price-body">
            {duration === 30 ? "Thirty" : duration} days on one live board. Not a
            second posting workflow — the listing you already wrote, in front of
            the people who wrote the spec.
          </p>
        </aside>
      </section>

      <ul className="hub-employers-grid">
        <li className="hub-employers-card">
          <p className="hub-employers-card-title">Your ATS, start to finish</p>
          <p className="hub-employers-card-body">
            Candidates apply on Workday, Greenhouse or whatever you run. No fake
            apply wall, no resumé database.
          </p>
        </li>
        <li className="hub-employers-card">
          <p className="hub-employers-card-title">Scoped to one board</p>
          <p className="hub-employers-card-body">
            A pin on {packagingLabel} appears on {packagingLabel}. It doesn&apos;t
            leak across the network.
          </p>
        </li>
        <li className="hub-employers-card">
          <p className="hub-employers-card-title">Thirty days, one checkout</p>
          <p className="hub-employers-card-body">
            {price} flat. One Stripe checkout, one invoice, no seat count and no
            annual contract.
          </p>
        </li>
        <li className="hub-employers-card hub-employers-card-muted">
          <p className="hub-employers-card-title">
            Bundles, once board two is live
          </p>
          <p className="hub-employers-card-body">
            Dual-vertical and network pins come next. Hiring across more than one
            niche already?{" "}
            <a href={`mailto:${tenant.contactEmail}`}>{tenant.contactEmail}</a>
          </p>
        </li>
      </ul>

      <div className="hub-employers-cta">
        <div className="hub-employers-cta-copy">
          <LogoMark variant="avatar" size={40} />
          <div>
            <p className="hub-employers-cta-title">
              {packagingLabel} is live now
            </p>
            <p className="hub-employers-cta-meta">
              {jobs.total} roles, {employers} employers, refreshed daily.
            </p>
          </div>
        </div>
        <a
          className="hub-btn hub-btn-primary"
          href={`${packagingOrigin}/sponsor`}
        >
          Pin a listing
        </a>
      </div>
    </div>
  );
}
