import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verticals } from "@config/tenants";
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

  const liveBoards = await Promise.all(
    verticals.map(async (vertical) => {
      const jobs = loadJobs(vertical.id);
      const employers = new Set(jobs.jobs.map((job) => job.company)).size;
      const origin = await verticalPublicOrigin(vertical.id);
      return {
        id: vertical.id,
        label: vertical.brand.hubLabel ?? vertical.brand.markLine1,
        contrast: vertical.copy.contrast,
        total: jobs.total,
        employers,
        price: formatUsd(vertical.sponsor.priceCents),
        duration: vertical.sponsor.durationDays,
        sponsorHref: `${origin}/sponsor`,
        boardHref: origin,
      };
    }),
  );

  return (
    <div className="hub-shell hub-employers">
      <section className="hub-employers-hero">
        <div className="hub-employers-copy">
          <p className="hub-employers-kicker">For employers</p>
          <h1>Pin the listing you already have.</h1>
          <p className="lede">
            One pin, one specialty board, the audience that actually matches the
            role. Candidates finish on your Workday or Greenhouse — we
            don&apos;t take the application.
          </p>
          <div className="hub-hero-actions">
            <a className="hub-btn hub-btn-amber" href="#boards">
              Choose a board
            </a>
            <Link className="hub-btn hub-btn-ghost" href="/niches">
              Browse live boards
            </Link>
          </div>
        </div>
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
            A pin appears on the board you choose. It doesn&apos;t leak across
            the network.
          </p>
        </li>
        <li className="hub-employers-card">
          <p className="hub-employers-card-title">Flat checkout</p>
          <p className="hub-employers-card-body">
            One Stripe checkout per pin, one invoice, no seat count and no annual
            contract. Price is set per board.
          </p>
        </li>
      </ul>

      <section className="hub-employers-boards" id="boards">
        <h2 className="hub-section-head">Live boards</h2>
        <p className="hub-section-intro">
          Pick the specialty board that reaches the role you are hiring. Pin
          price and duration are listed per board.
        </p>
        <ul className="hub-employers-boards-grid">
          {liveBoards.map((board) => (
            <li key={board.id} className="hub-employers-board-card">
              <div className="hub-employers-board-copy">
                <p className="hub-employers-board-label">{board.label}</p>
                <p className="hub-employers-board-contrast">{board.contrast}</p>
                <p className="hub-employers-board-meta">
                  {board.total} roles · {board.employers} employers · refreshed
                  daily
                </p>
              </div>
              <div className="hub-employers-board-price">
                <p className="hub-employers-board-amount">{board.price}</p>
                <p className="hub-employers-board-duration">
                  {board.duration === 30 ? "Thirty" : board.duration} days
                </p>
              </div>
              <div className="hub-employers-board-actions">
                <a
                  className="hub-btn hub-btn-amber"
                  href={board.sponsorHref}
                >
                  Pin on {board.label}
                </a>
                <a className="hub-employers-board-browse" href={board.boardHref}>
                  Browse {board.label} →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="hub-employers-cta">
        <div className="hub-employers-cta-copy">
          <div>
            <p className="hub-employers-cta-title">
              Hiring across more than one board?
            </p>
            <p className="hub-employers-cta-meta">
              Talk dual pins — we can coordinate sponsorship across live boards.{" "}
              <a href={`mailto:${tenant.contactEmail}`}>{tenant.contactEmail}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
