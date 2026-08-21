import { Resend } from "resend";
import type { Niche } from "../../ingest/types";
import type { VerticalTenant } from "@config/tenants";
import { formatNiche } from "./niches";

export type DigestJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  niche: Niche | null;
  remote: boolean;
  url: string;
  applyUrl: string;
};

export type MailResult = {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress(tenant: VerticalTenant): string {
  const configured = process.env.ALERTS_FROM_EMAIL?.trim();
  if (configured) {
    if (configured.includes("<")) return configured;
    return `${tenant.brand.name} <${configured}>`;
  }
  // Resend test sender until a domain is verified.
  return `${tenant.brand.name} <onboarding@resend.dev>`;
}

function brandShell(input: {
  tenant: VerticalTenant;
  origin: string;
  preheader: string;
  title: string;
  bodyHtml: string;
  footerNote: string;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const { tenant, origin, preheader, title, bodyHtml, footerNote, unsubscribeUrl } =
    input;
  const paper = tenant.theme.paper;
  const kraft = tenant.theme.kraft;
  const stamp = tenant.theme.accent;
  const ink = "#1d1712";
  const rule = "#c9b79a";
  const muted = "#5c4c3c";
  const outer = "#d9cbb3";
  const mark2 = tenant.brand.markLine2
    ? `<br />${escapeHtml(tenant.brand.markLine2)}`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${outer};color:${ink};font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${outer};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${paper};border-left:1px solid ${rule};border-right:1px solid ${rule};">
          <tr>
            <td style="padding:28px 28px 18px;border-bottom:3px solid ${ink};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <a href="${escapeHtml(origin)}" style="text-decoration:none;color:${ink};">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width:28px;height:28px;border:2px solid ${ink};box-shadow:4px 4px 0 ${kraft};"></td>
                          <td style="padding-left:12px;font-family:'Source Serif 4',Georgia,serif;font-size:22px;line-height:1.1;font-weight:600;">
                            ${escapeHtml(tenant.brand.markLine1)}${mark2}
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td align="right" style="font-size:12px;line-height:1.35;color:${muted};max-width:160px;">
                    ${escapeHtml(tenant.brand.tagline)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;color:${muted};">
                Free job alerts
              </p>
              <h1 style="margin:0 0 16px;font-family:'Source Serif 4',Georgia,serif;font-size:28px;line-height:1.15;font-weight:600;color:${ink};">
                ${escapeHtml(title)}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;border-top:1px solid ${rule};">
              <p style="margin:18px 0 8px;font-size:13px;line-height:1.5;color:${muted};">
                ${escapeHtml(footerNote)}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:${muted};">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:${stamp};">Unsubscribe</a>
                ·
                <a href="${escapeHtml(origin)}" style="color:${ink};">${escapeHtml(tenant.brand.name)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    title,
    "",
    preheader,
    "",
    footerNote,
    `Unsubscribe: ${unsubscribeUrl}`,
    origin,
  ].join("\n");

  return { html, text };
}

function ctaButton(href: string, label: string, ink: string, paper: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:8px 0 4px;padding:10px 14px;background:${ink};color:${paper};text-decoration:none;font-size:14px;border:1px solid ${ink};">${escapeHtml(label)}</a>`;
}

function jobCardsHtml(
  jobs: DigestJob[],
  theme: VerticalTenant["theme"],
): string {
  const ink = "#1d1712";
  const kraft = theme.kraft;
  const muted = "#5c4c3c";
  const card = "#fffaf2";

  return jobs
    .map((job) => {
      const niche = formatNiche(job.niche);
      const meta = [
        escapeHtml(job.company),
        escapeHtml(job.location),
        job.remote ? "Remote / hybrid" : null,
        niche ? escapeHtml(niche) : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;background:${card};border:1px solid ${ink};box-shadow:3px 3px 0 ${kraft};">
  <tr>
    <td style="padding:14px 16px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:${muted};">${escapeHtml(job.company)}</p>
      <h2 style="margin:4px 0 8px;font-family:'Source Serif 4',Georgia,serif;font-size:18px;line-height:1.25;font-weight:600;">
        <a href="${escapeHtml(job.url)}" style="color:${ink};text-decoration:none;">${escapeHtml(job.title)}</a>
      </h2>
      <p style="margin:0 0 12px;font-size:13px;color:${muted};">${meta}</p>
      <a href="${escapeHtml(job.applyUrl)}" style="display:inline-block;padding:8px 12px;background:${ink};color:${theme.paper};text-decoration:none;font-size:13px;border:1px solid ${ink};">Apply on career site</a>
      <a href="${escapeHtml(job.url)}" style="display:inline-block;margin-left:8px;padding:8px 12px;background:transparent;color:${ink};text-decoration:none;font-size:13px;border:1px solid ${ink};">Details</a>
    </td>
  </tr>
</table>`;
    })
    .join("\n");
}

async function sendMail(input: {
  tenant: VerticalTenant;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<MailResult> {
  if (!resendConfigured()) {
    console.info(
      `[alerts] RESEND_API_KEY missing — skipped email to ${input.to}: ${input.subject}`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const payload: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text: string;
      replyTo?: string;
    } = {
      from: fromAddress(input.tenant),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    // Only set reply-to when it shares a likely-verified apex with the from address.
    const from = payload.from;
    const reply = input.tenant.contactEmail;
    if (reply && from.includes("@") && reply.includes("@")) {
      const fromDomain = from.slice(from.lastIndexOf("@") + 1).replace(/>$/, "");
      const replyDomain = reply.slice(reply.lastIndexOf("@") + 1);
      if (
        fromDomain === replyDomain ||
        replyDomain.endsWith(`.${fromDomain}`) ||
        fromDomain.endsWith(`.${replyDomain}`)
      ) {
        payload.replyTo = reply;
      }
    }
    const { data, error } = await resend.emails.send(payload);
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

export function buildConfirmEmail(input: {
  tenant: VerticalTenant;
  origin: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const ink = "#1d1712";
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;max-width:42rem;">
      Confirm your free alert for <strong>${escapeHtml(input.tenant.copy.contrast)}</strong>
      Open roles land in your inbox when they appear — apply on the employer career site.
    </p>
    ${ctaButton(input.confirmUrl, "Confirm alerts", ink, input.tenant.theme.paper)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#5c4c3c;">
      If you did not request this, you can ignore the message or
      <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${input.tenant.theme.accent};">unsubscribe</a>.
    </p>
  `;
  const shell = brandShell({
    tenant: input.tenant,
    origin: input.origin,
    preheader: `Confirm free ${input.tenant.brand.name} alerts.`,
    title: "Confirm your job alerts",
    bodyHtml,
    footerNote: input.tenant.brand.footer,
    unsubscribeUrl: input.unsubscribeUrl,
  });
  return {
    subject: `Confirm your ${input.tenant.brand.name} alerts`,
    ...shell,
  };
}

export function buildDigestEmail(input: {
  tenant: VerticalTenant;
  origin: string;
  jobs: DigestJob[];
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const count = input.jobs.length;
  const subject =
    count === 1
      ? `1 new role on ${input.tenant.brand.name}`
      : `${count} new roles on ${input.tenant.brand.name}`;
  const ink = "#1d1712";
  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:16px;line-height:1.5;">
      Fresh roles for <strong>${escapeHtml(input.tenant.copy.contrast)}</strong>
      Apply on the company career site.
    </p>
    ${jobCardsHtml(input.jobs, input.tenant.theme)}
    ${ctaButton(input.origin, "Browse the full board", ink, input.tenant.theme.paper)}
  `;
  const textJobs = input.jobs
    .map(
      (job) =>
        `- ${job.title} · ${job.company} · ${job.location}\n  ${job.applyUrl}`,
    )
    .join("\n");
  const shell = brandShell({
    tenant: input.tenant,
    origin: input.origin,
    preheader:
      count === 1
        ? `${input.jobs[0].title} at ${input.jobs[0].company}`
        : `${count} new roles on ${input.tenant.brand.name}`,
    title: count === 1 ? "1 new role" : `${count} new roles`,
    bodyHtml,
    footerNote: input.tenant.brand.footer,
    unsubscribeUrl: input.unsubscribeUrl,
  });
  return {
    subject,
    html: shell.html,
    text: `${shell.text}\n\n${textJobs}`,
  };
}

export async function sendConfirmEmail(input: {
  tenant: VerticalTenant;
  to: string;
  origin: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}): Promise<MailResult> {
  const message = buildConfirmEmail(input);
  return sendMail({
    tenant: input.tenant,
    to: input.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export async function sendDigestEmail(input: {
  tenant: VerticalTenant;
  to: string;
  origin: string;
  jobs: DigestJob[];
  unsubscribeUrl: string;
}): Promise<MailResult> {
  const message = buildDigestEmail(input);
  return sendMail({
    tenant: input.tenant,
    to: input.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

export { resendConfigured };
