import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unsubscribeFromAlerts } from "@/lib/alerts";
import { buildPageMetadata } from "@/lib/seo";
import { getRequestTenant } from "@/lib/tenant";

type Props = { searchParams: Promise<{ token?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  return buildPageMetadata({
    tenant,
    title: "Unsubscribed",
    description: "You have been removed from job alerts.",
    path: "/alerts/unsubscribe",
    index: false,
  });
}

export default async function AlertUnsubscribePage({ searchParams }: Props) {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const { token } = await searchParams;
  const removed = token
    ? await unsubscribeFromAlerts({ verticalId: tenant.id, token })
    : null;

  return (
    <article className="sponsor-page">
      <p className="kicker">Job alerts</p>
      {removed ? (
        <>
          <h1>You’re unsubscribed</h1>
          <p className="lede">
            <strong>{removed.email}</strong> will no longer receive{" "}
            {tenant.brand.name} alerts.
          </p>
        </>
      ) : (
        <>
          <h1>Already unsubscribed</h1>
          <p className="lede">
            That address is not on the alert list, or the link is invalid.
          </p>
        </>
      )}
      <div className="sponsor-actions">
        <Link className="board-btn board-btn-primary" href="/">
          Back to the board
        </Link>
        <Link className="board-btn board-btn-outline" href="/#alerts">
          Subscribe again
        </Link>
      </div>
    </article>
  );
}
