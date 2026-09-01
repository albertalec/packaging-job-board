import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmAlertSubscription } from "@/lib/alerts";
import { buildPageMetadata } from "@/lib/seo";
import { getRequestTenant } from "@/lib/tenant";

type Props = { searchParams: Promise<{ token?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  return buildPageMetadata({
    tenant,
    title: "Alert confirmed",
    description: "Your job alerts are active.",
    path: "/alerts/confirm",
    index: false,
  });
}

export default async function AlertConfirmPage({ searchParams }: Props) {
  const tenant = await getRequestTenant();
  if (tenant.kind !== "vertical") notFound();

  const { token } = await searchParams;
  const subscriber = token
    ? await confirmAlertSubscription({ verticalId: tenant.id, token })
    : null;

  return (
    <article className="sponsor-page">
      <p className="kicker">Job alerts</p>
      {subscriber ? (
        <>
          <h1>You’re on the list</h1>
          <p className="lede">
            Alerts for <strong>{tenant.copy.contrast}</strong> will go to{" "}
            <strong>{subscriber.email}</strong>. We’ll email you when new roles
            appear on {tenant.brand.name} — apply on the employer career site.
          </p>
        </>
      ) : (
        <>
          <h1>Link expired or invalid</h1>
          <p className="lede">
            That confirmation link is not valid. Subscribe again from the board
            homepage and use the newest email.
          </p>
        </>
      )}
      <div className="sponsor-actions">
        <Link className="board-btn board-btn-primary" href="/">
          Browse open roles
        </Link>
        {!subscriber ? (
          <Link className="board-btn board-btn-outline" href="/#alerts">
            Try again
          </Link>
        ) : null}
      </div>
    </article>
  );
}
