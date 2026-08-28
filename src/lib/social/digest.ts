import {
  getVertical,
  listVerticalIds,
  tenantOrigin,
} from "@config/tenants";
import {
  generateLinkedInPostDraft,
  type LinkedInDraftRunResult,
  type LinkedInPostType,
} from "./linkedin";
import { sendLinkedInDraftEmail, socialDraftEmailConfigured } from "./mail";

export type LinkedInDigestItemResult = {
  vertical: string;
  postType: LinkedInPostType;
  draft: LinkedInDraftRunResult;
  emailed: boolean;
  emailSkipped?: boolean;
  emailError?: string;
  skippedReason?: string;
};

export type LinkedInDigestRunResult = {
  postType: LinkedInPostType;
  items: LinkedInDigestItemResult[];
  recipients: string[];
};

/** Tue = industry pulse, Thu = job highlight (UTC). */
export function defaultPostTypeForUtcDay(now = new Date()): LinkedInPostType | null {
  const day = now.getUTCDay();
  if (day === 2) return "current-events";
  if (day === 4) return "fresh-role";
  return null;
}

export async function runLinkedInDraftDigest(input: {
  verticalId?: string;
  postType?: LinkedInPostType;
  /** When true, generate only — do not email. */
  dryRun?: boolean;
  /** When true, skip if today is not Tue/Thu unless postType is set. */
  cronDayOnly?: boolean;
}): Promise<LinkedInDigestRunResult> {
  const postType =
    input.postType ??
    (input.cronDayOnly ? defaultPostTypeForUtcDay() : "current-events");

  if (!postType) {
    return {
      postType: "current-events",
      items: [],
      recipients: [],
    };
  }

  const verticals = input.verticalId ? [input.verticalId] : listVerticalIds();
  const items: LinkedInDigestItemResult[] = [];

  for (const verticalId of verticals) {
    const tenant = getVertical(verticalId);
    const origin = tenantOrigin(tenant, {
      hostHeader: tenant.canonicalHost,
      proto: "https",
    });

    const draft = await generateLinkedInPostDraft({
      verticalId,
      postType,
      dryRun: input.dryRun ?? false,
    });

    const item: LinkedInDigestItemResult = {
      vertical: verticalId,
      postType,
      draft,
      emailed: false,
    };

    if (!draft.ok || !draft.draft) {
      item.skippedReason =
        draft.errors.join("; ") || draft.skipped
          ? "Generation skipped or failed."
          : "No draft produced.";
      items.push(item);
      continue;
    }

    if (input.dryRun) {
      item.skippedReason = "dry-run — email not sent";
      items.push(item);
      continue;
    }

    if (!socialDraftEmailConfigured()) {
      item.emailSkipped = true;
      item.skippedReason = "SOCIAL_DRAFT_TO_EMAIL is not configured.";
      items.push(item);
      continue;
    }

    const sent = await sendLinkedInDraftEmail({
      tenant,
      origin,
      result: draft,
    });

    if (!sent.ok) {
      item.emailError = sent.error || "Email send failed.";
      items.push(item);
      continue;
    }

    if (sent.skipped) {
      item.emailSkipped = true;
      item.skippedReason = "RESEND_API_KEY missing.";
    } else {
      item.emailed = true;
    }
    items.push(item);
  }

  return {
    postType,
    items,
    recipients: process.env.SOCIAL_DRAFT_TO_EMAIL?.trim()
      ? process.env.SOCIAL_DRAFT_TO_EMAIL.split(/[,;\s]+/).filter(Boolean)
      : [],
  };
}

export function digestSummary(result: LinkedInDigestRunResult): {
  generated: number;
  emailed: number;
  failed: number;
} {
  let generated = 0;
  let emailed = 0;
  let failed = 0;
  for (const item of result.items) {
    if (item.draft.ok && item.draft.draft) generated += 1;
    if (item.emailed) emailed += 1;
    if (!item.draft.ok || item.emailError) failed += 1;
  }
  return { generated, emailed, failed };
}
