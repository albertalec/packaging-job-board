import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getRequestTenant } from "@/lib/tenant";

type SearchParams = { searchParams: Promise<{ session_id?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  return buildPageMetadata({
    tenant,
    title: "Sponsorship confirmed",
    description: "Your sponsored job placement is being activated.",
    path: "/sponsor/success",
    index: false,
  });
}

export default async function SponsorSuccessPage({ searchParams }: SearchParams) {
  const tenant = await getRequestTenant();
  const { session_id: sessionId } = await searchParams;
  let jobId: string | undefined;
  let jobTitle: string | undefined;

  if (sessionId && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      jobId = session.metadata?.jobId;
      jobTitle = session.metadata?.jobTitle;
    } catch {
      // Session lookup is best-effort for the thank-you copy.
    }
  }

  const boardLabel =
    tenant.kind === "vertical"
      ? tenant.brand.hubLabel ?? tenant.brand.markLine1
      : "the board";

  return (
    <div className="board-shell board-sponsor-flow">
      <section className="board-sponsor-success">
        <p className="board-eyebrow">Payment received</p>
        <h1>Thank you — this listing is being pinned</h1>
        <p className="lede">
          {jobTitle ? (
            <>
              Payment confirmed for <strong>{jobTitle}</strong>. It should appear
              at the top of the {boardLabel} board within a minute.
            </>
          ) : (
            <>
              Payment confirmed. It should appear at the top of the {boardLabel}{" "}
              board within a minute.
            </>
          )}
        </p>
        <div className="board-hero-actions">
          {jobId ? (
            <Link className="board-btn board-btn-primary" href={`/jobs/${jobId}`}>
              View pinned listing
            </Link>
          ) : null}
          <Link className="board-btn board-btn-ghost" href="/">
            Back to {boardLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
