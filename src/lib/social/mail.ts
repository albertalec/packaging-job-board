import { Resend } from "resend";
import type { VerticalTenant } from "@config/tenants";
import {
  formatAlertFromAddress,
  resendConfigured,
  type MailResult,
} from "../alerts-mail";
import { isValidEmail } from "../alerts-store";
import type { LinkedInDraftRunResult, LinkedInPostType } from "./linkedin";

const POST_TYPE_LABEL: Record<LinkedInPostType, string> = {
  "current-events": "Industry pulse (X trend)",
  contrast: "Contrast / specialty",
  "fresh-role": "New job highlight",
  proof: "Proof / how it works",
  employer: "Employer pin",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Comma- or space-separated list in SOCIAL_DRAFT_TO_EMAIL. */
export function socialDraftRecipients(): string[] {
  const raw = process.env.SOCIAL_DRAFT_TO_EMAIL?.trim();
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => isValidEmail(entry));
}

export function socialDraftEmailConfigured(): boolean {
  return socialDraftRecipients().length > 0;
}

export function buildLinkedInDraftEmail(input: {
  tenant: VerticalTenant;
  origin: string;
  result: LinkedInDraftRunResult;
}): { subject: string; html: string; text: string } {
  const { tenant, origin, result } = input;
  const label = POST_TYPE_LABEL[result.postType];
  const boardLabel = tenant.brand.hubLabel?.trim() || tenant.brand.name;
  const subject = `LinkedIn draft — ${boardLabel} · ${label}`;
  const draft = result.draft ?? "";
  const draftHtml = escapeHtml(draft).replaceAll("\n", "<br />");

  const xLines =
    result.xTweets && result.xTweets.length > 0
      ? result.xTweets
          .slice(0, 4)
          .map((tweet) => `• ${tweet.text.replace(/\s+/g, " ").slice(0, 140)}…`)
          .join("\n")
      : "No X context used for this draft.";

  const jobBlock = result.job
    ? `Job anchor: ${result.job.title} at ${result.job.company}\n${result.job.url}`
    : "";

  const errorBlock =
    result.errors.length > 0 ? `Notes:\n${result.errors.join("\n")}` : "";

  const text = [
    subject,
    "",
    "— Copy below to LinkedIn (edit before posting) —",
    "",
    draft,
    "",
    jobBlock,
    "",
    "X themes (do not quote on LinkedIn):",
    xLines,
    "",
    errorBlock,
    "",
    "Checklist: contrast line · one CTA · no invented metrics · canonical URL",
    `Board: ${origin}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="font-family:Archivo,Helvetica,Arial,sans-serif;color:#0D1B2A;line-height:1.5;padding:24px;">
  <p style="margin:0 0 8px;font-size:13px;color:#4B5563;">${escapeHtml(label)} · ${escapeHtml(tenant.copy.contrast)}</p>
  <h1 style="margin:0 0 16px;font-size:20px;">LinkedIn draft</h1>
  <div style="margin:0 0 20px;padding:16px;background:#F1F3F5;border-left:3px solid #0D7D77;font-size:16px;white-space:pre-wrap;">${draftHtml}</div>
  ${
    result.job
      ? `<p style="margin:0 0 12px;font-size:14px;"><strong>Job link:</strong> <a href="${escapeHtml(result.job.url)}">${escapeHtml(result.job.title)} · ${escapeHtml(result.job.company)}</a></p>`
      : ""
  }
  <p style="margin:16px 0 8px;font-size:12px;color:#4B5563;font-weight:600;">X themes (reference only — do not quote)</p>
  <pre style="margin:0 0 16px;padding:12px;background:#fff;border:1px solid #E7EAEE;font-size:12px;white-space:pre-wrap;">${escapeHtml(xLines)}</pre>
  <p style="margin:0;font-size:12px;color:#4B5563;">Review SOCIAL_MEDIA_PLAN §12 before posting. Nothing auto-publishes to LinkedIn.</p>
</body>
</html>`;

  return { subject, html, text };
}

export async function sendLinkedInDraftEmail(input: {
  tenant: VerticalTenant;
  origin: string;
  result: LinkedInDraftRunResult;
  to?: string[];
}): Promise<MailResult> {
  const recipients = input.to ?? socialDraftRecipients();
  if (recipients.length === 0) {
    return {
      ok: false,
      error: "SOCIAL_DRAFT_TO_EMAIL is not configured.",
    };
  }

  if (!input.result.ok || !input.result.draft) {
    return {
      ok: false,
      error: input.result.errors.join("; ") || "No draft to send.",
    };
  }

  if (!resendConfigured()) {
    console.info(
      `[social] RESEND_API_KEY missing — skipped LinkedIn draft email to ${recipients.join(", ")}`,
    );
    return { ok: true, skipped: true };
  }

  const message = buildLinkedInDraftEmail({
    tenant: input.tenant,
    origin: input.origin,
    result: input.result,
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = formatAlertFromAddress(
      input.tenant,
      process.env.ALERTS_FROM_EMAIL,
    );
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: input.tenant.contactEmail,
    });
    if (error) {
      return { ok: false, error: error.message || "Email provider rejected the send." };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "send failed",
    };
  }
}
