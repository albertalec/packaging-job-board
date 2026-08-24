import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { packaging } from "@config/packaging";
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

  return (
    <article className="sponsor-page">
      <p className="kicker">For employers</p>
      <h1>Pin the listing you already have</h1>
      <p className="lede">
        {tenant.brand.employerTagline} Each pin is scoped to one specialty
        board — the audience that actually matches the role you are hiring.
      </p>
      <ul className="sponsor-benefits">
        <li>
          Candidates apply on your Workday, Greenhouse, or other ATS — no fake
          apply wall
        </li>
        <li>
          Sponsorship is scoped to one board. A pin on {packagingLabel} does not
          appear on other niches
        </li>
        <li>
          {price} for {packaging.sponsor.durationDays} days on a live board —
          pin what you already posted, not a second posting workflow
        </li>
        <li>
          Dual-vertical and network pins come after a second board is live.
          One invoice, still one Stripe checkout
        </li>
      </ul>
      <div className="sponsor-actions">
        <a className="apply big amber" href={`${packagingOrigin}/sponsor`}>
          Pin on {packagingLabel} board — {price}
        </a>
        <Link className="ghost big" href="/niches">
          Browse live boards
        </Link>
      </div>
      <p className="sponsor-footnote">
        Bundles (dual pin / network pin) are not for sale yet. Email us if you
        hire across more than one niche:{" "}
        <a href={`mailto:${tenant.contactEmail}`}>{tenant.contactEmail}</a>
      </p>
    </article>
  );
}
