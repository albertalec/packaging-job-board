import type { Metadata } from "next";
import Link from "next/link";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Sponsorship confirmed",
  description: "Your sponsored job placement is being activated.",
};

type SearchParams = { searchParams: Promise<{ session_id?: string }> };

export default async function SponsorSuccessPage({ searchParams }: SearchParams) {
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

  return (
    <article className="sponsor-page">
      <p className="kicker">Payment received</p>
      <h1>Thank you — this listing is being pinned</h1>
      <p className="lede">
        {jobTitle ? (
          <>
            Stripe confirmed your payment for <strong>{jobTitle}</strong>. It
            should appear at the top of this board within a minute.
          </>
        ) : (
          <>
            Stripe confirmed your payment. It should appear at the top of this
            board within a minute.
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
          Back to job board
        </Link>
      </div>
    </article>
  );
}
