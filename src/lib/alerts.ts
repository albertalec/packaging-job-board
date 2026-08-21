import { randomBytes } from "node:crypto";
import type { Niche } from "../../ingest/types";
import { getVertical, tenantOrigin, type VerticalTenant } from "@config/tenants";
import { loadJobs } from "./jobs";
import { jobState } from "./states";
import {
  confirmSubscriber,
  findSubscriberByEmail,
  isValidEmail,
  listActiveSubscribers,
  markJobsNotified,
  removeSubscriber,
  upsertActiveSubscriber,
  type AlertSubscriber,
} from "./alerts-store";
import {
  sendDigestEmail,
  sendWelcomeEmail,
  type DigestJob,
} from "./alerts-mail";

const VALID_NICHES = new Set<Niche>([
  "automotive",
  "pharma",
  "cpg",
  "food-beverage",
  "industrial",
]);

export function newAlertToken(): string {
  return randomBytes(24).toString("hex");
}

export function normalizeAlertFilters(input: {
  niche?: string | null;
  state?: string | null;
}): { niche: Niche | null; state: string | null } {
  const nicheRaw = input.niche?.trim().toLowerCase() || null;
  const niche =
    nicheRaw && VALID_NICHES.has(nicheRaw as Niche)
      ? (nicheRaw as Niche)
      : null;
  const stateRaw = input.state?.trim().toUpperCase() || null;
  const state =
    stateRaw && /^[A-Z]{2}$/.test(stateRaw) ? stateRaw : null;
  return { niche, state };
}

function alertUrls(tenant: VerticalTenant, token: string, origin: string) {
  return {
    confirmUrl: `${origin}/alerts/confirm?token=${encodeURIComponent(token)}`,
    unsubscribeUrl: `${origin}/alerts/unsubscribe?token=${encodeURIComponent(token)}`,
  };
}

export async function subscribeToAlerts(input: {
  verticalId: string;
  email: string;
  niche?: string | null;
  state?: string | null;
  origin: string;
}): Promise<
  | { ok: true; status: "subscribed" | "already_active"; email: string }
  | { ok: false; error: string }
> {
  if (!isValidEmail(input.email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const tenant = getVertical(input.verticalId);
  const filters = normalizeAlertFilters(input);
  const existing = await findSubscriberByEmail(tenant.id, input.email);

  if (existing?.status === "active") {
    return { ok: true, status: "already_active", email: existing.email };
  }

  const token = existing?.token ?? newAlertToken();
  const subscriber = await upsertActiveSubscriber({
    vertical: tenant.id,
    email: input.email,
    token,
    niche: filters.niche,
    state: filters.state,
  });

  // Baseline so the first digest is only roles posted after subscribe.
  const { jobs } = loadJobs(tenant.id);
  const baseline = jobs
    .filter((job) => matchesFilters(job, subscriber))
    .map((job) => job.id);
  await markJobsNotified(tenant.id, subscriber.token, baseline);

  const urls = alertUrls(tenant, subscriber.token, input.origin);
  const sent = await sendWelcomeEmail({
    tenant,
    to: subscriber.email,
    origin: input.origin,
    unsubscribeUrl: urls.unsubscribeUrl,
  });

  if (!sent.ok) {
    return {
      ok: false,
      error: sent.error || "Could not send the welcome email.",
    };
  }

  if (sent.skipped && process.env.VERCEL) {
    return {
      ok: false,
      error: "Email delivery is not configured yet. Try again soon.",
    };
  }

  return { ok: true, status: "subscribed", email: subscriber.email };
}

export async function confirmAlertSubscription(input: {
  verticalId: string;
  token: string;
}): Promise<AlertSubscriber | null> {
  const confirmed = await confirmSubscriber(input.verticalId, input.token);
  if (!confirmed) return null;

  // Baseline to current inventory so the first digest is only truly new roles.
  const { jobs } = loadJobs(input.verticalId);
  const baseline = jobs
    .filter((job) => matchesFilters(job, confirmed))
    .map((job) => job.id);
  await markJobsNotified(input.verticalId, confirmed.token, baseline);
  return {
    ...confirmed,
    notifiedJobIds: [...new Set([...confirmed.notifiedJobIds, ...baseline])].slice(
      -500,
    ),
  };
}

export async function unsubscribeFromAlerts(input: {
  verticalId: string;
  token: string;
}): Promise<AlertSubscriber | null> {
  return removeSubscriber(input.verticalId, input.token);
}

function matchesFilters(
  job: ReturnType<typeof loadJobs>["jobs"][number],
  subscriber: AlertSubscriber,
): boolean {
  if (subscriber.niche && job.niche !== subscriber.niche) return false;
  if (subscriber.state && jobState(job) !== subscriber.state) return false;
  return true;
}

export function jobsForSubscriber(
  jobs: ReturnType<typeof loadJobs>["jobs"],
  subscriber: AlertSubscriber,
): ReturnType<typeof loadJobs>["jobs"] {
  const seen = new Set(subscriber.notifiedJobIds);
  return jobs.filter(
    (job) => !seen.has(job.id) && matchesFilters(job, subscriber),
  );
}

function toDigestJobs(
  tenant: VerticalTenant,
  origin: string,
  jobs: ReturnType<typeof loadJobs>["jobs"],
): DigestJob[] {
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    niche: job.niche,
    remote: job.remote,
    url: `${origin}/jobs/${job.id}`,
    applyUrl: job.applyUrl,
  }));
}

export type DigestRunResult = {
  vertical: string;
  subscribers: number;
  emailed: number;
  skippedEmpty: number;
  failed: number;
  errors: string[];
};

/**
 * Send digests for jobs a subscriber has not been notified about yet.
 * Confirmation baselines notified ids to the live board so digests are deltas only.
 */
export async function runAlertDigest(input: {
  verticalId: string;
  origin?: string;
  /** Cap jobs per email. */
  maxJobsPerEmail?: number;
}): Promise<DigestRunResult> {
  const tenant = getVertical(input.verticalId);
  const origin =
    input.origin ??
    tenantOrigin(tenant, { hostHeader: tenant.canonicalHost, proto: "https" });
  const maxJobs = input.maxJobsPerEmail ?? 12;
  const { jobs } = loadJobs(tenant.id);
  const active = await listActiveSubscribers(tenant.id);

  const result: DigestRunResult = {
    vertical: tenant.id,
    subscribers: active.length,
    emailed: 0,
    skippedEmpty: 0,
    failed: 0,
    errors: [],
  };

  for (const subscriber of active) {
    const unseen = jobsForSubscriber(jobs, subscriber).slice(0, maxJobs);
    if (unseen.length === 0) {
      result.skippedEmpty += 1;
      continue;
    }

    const urls = alertUrls(tenant, subscriber.token, origin);
    const sent = await sendDigestEmail({
      tenant,
      to: subscriber.email,
      origin,
      jobs: toDigestJobs(tenant, origin, unseen),
      unsubscribeUrl: urls.unsubscribeUrl,
    });

    if (!sent.ok) {
      result.failed += 1;
      result.errors.push(`${subscriber.email}: ${sent.error || "send failed"}`);
      continue;
    }

    await markJobsNotified(
      tenant.id,
      subscriber.token,
      unseen.map((job) => job.id),
    );
    result.emailed += 1;
  }

  return result;
}

export function cronAuthorized(request: Request): boolean {
  const secret = process.env.ALERTS_CRON_SECRET?.trim();
  if (!secret) {
    // Allow Vercel Cron (adds Authorization: Bearer <CRON_SECRET> when set)
    // or open local/dev when no secret is configured.
    const vercelCron = request.headers.get("x-vercel-cron");
    if (vercelCron) return true;
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}
