import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { packaging } from "@config/packaging";
import { formatUsd, getRequestTenant, verticalPublicOrigin } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Employers",
  description:
    "Pin an ATS listing on a specialist Niche Board. Audience precision, not a slot on a generic board.",
};

export default async function EmployersPage() {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "hub") notFound();

  const packagingOrigin = await verticalPublicOrigin("packaging");
  const price = formatUsd(packaging.sponsor.priceCents);

  return (
    <article className="sponsor-page">
      <p className="kicker">For employers</p>
      <h1>Pin the listing you already have</h1>
      <p className="lede">{tenant.brand.employerTagline}</p>
      <ul className="sponsor-benefits">
        <li>
          Candidates apply on your Workday, Greenhouse, or other ATS — no fake
          apply wall
        </li>
        <li>
          Sponsorship is scoped to one board. A packaging pin does not appear
          on other niches
        </li>
        <li>
          {price} for {packaging.sponsor.durationDays} days on Packaging Jobs —
          cheaper than posting the same role on a general packaging board
        </li>
        <li>
          Dual-vertical and network pins come after a second board is live.
          One invoice, still one Stripe checkout
        </li>
      </ul>
      <div className="sponsor-actions">
        <a className="apply big" href={`${packagingOrigin}/sponsor`}>
          Pin a packaging listing — {price}
        </a>
        <a className="ghost big" href={`mailto:${tenant.contactEmail}`}>
          {tenant.contactEmail}
        </a>
      </div>
      <p className="sponsor-footnote">
        Bundles (dual pin / network pin) are not for sale yet. Email us if you
        hire across more than one niche.
      </p>
    </article>
  );
}
