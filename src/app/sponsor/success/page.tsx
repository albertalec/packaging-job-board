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

  const boardName = tenant.kind === "vertical" ? tenant.brand.name : "the board";

  return (
    <article className="sponsor-page">
      <p className="kicker">Payment received</p>
      <h1>Thank you — this listing is being pinned</h1>
      <p className="lede">
        {jobTitle ? (
          <>
            Payment confirmed for <strong>{jobTitle}</strong>. It should appear
            at the top of {boardName} within a minute.
          </>
        ) : (
          <>
            Payment confirmed. It should appear at the top of {boardName} within
            a minute.
          </>
        )}
      </p>
      <div className="sponsor-actions">
        {jobId ? (
          <Link className="apply big" href={`/jobs/${jobId}`}>
            View sponsored listing
          </Link>
        ) : null}
        <Link className="ghost" href="/">
          Back to {boardName}
        </Link>
      </div>
    </article>
  );
}
