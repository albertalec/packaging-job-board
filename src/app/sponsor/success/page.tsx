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
      <h1>Thank you — sponsorship is on the way</h1>
      <p className="lede">
        Stripe confirmed your payment
        {jobTitle ? (
          <>
            {" "}
            for <strong>{jobTitle}</strong>
          </>
        ) : null}
        . The listing should show as sponsored within a minute once the webhook runs.
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
