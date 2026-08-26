import { Resend } from "resend";
import type { Niche } from "../../ingest/types";
import { ALERTS_FROM_EMAIL as DEFAULT_ALERTS_FROM } from "@config/email";
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

const NETWORK_TAGLINE = "The right jobs, not all the jobs.";
const EMAIL_MARK_PNG = "/brand/png/email-mark-reverse-48.png";
const EMAIL_ROUNDEL_PNG = "/brand/png/email-roundel-navy-40.png";

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

/** Brand Guide v1 palette for HTML email (inline styles). */
function emailPalette(theme: VerticalTenant["theme"]) {
  return {
    navy: theme.navy ?? "#0D1B2A",
    teal: theme.teal ?? theme.accent ?? "#0D7D77",
    slate: theme.slate ?? "#4B5563",
    mist: theme.mist ?? "#F1F3F5",
    paper: theme.paper ?? "#FFFFFF",
    rule: "#E7EAEE",
    rail: "#B4BCC5",
  };
}

function brandAssetUrl(origin: string, assetPath: string): string {
  return `${origin.replace(/\/$/, "")}${assetPath}`;
}

/** Hosted PNG — inline SVG is stripped by Gmail, Outlook, and most clients. */
function logoMarkImg(origin: string, size = 24): string {
  const src = escapeHtml(brandAssetUrl(origin, EMAIL_MARK_PNG));
  return `<img src="${src}" width="${size}" height="${size}" alt="Niche Board" style="display:block;border:0;outline:none;text-decoration:none;" />`;
}

function logoRoundelImg(origin: string, size = 20): string {
  const src = escapeHtml(brandAssetUrl(origin, EMAIL_ROUNDEL_PNG));
  return `<img src="${src}" width="${size}" height="${size}" alt="" style="display:block;border:0;outline:none;text-decoration:none;" />`;
}

/** Build Resend From header: display name from tenant config, same verified address. */
export function formatAlertFromAddress(
  tenant: VerticalTenant,
  configured?: string,
): string {
  const displayName =
    tenant.brand.alertsFromName ?? `${tenant.brand.name} Alerts`;
  const raw = configured?.trim();
  if (!raw) {
    return `${displayName} <onboarding@resend.dev>`;
  }
  const bracketed = raw.match(/<([^>]+)>/);
  const email = (bracketed ? bracketed[1] : raw).trim();
  return `${displayName} <${email}>`;
}

function fromAddress(tenant: VerticalTenant): string {
  return formatAlertFromAddress(
    tenant,
    process.env.ALERTS_FROM_EMAIL ?? DEFAULT_ALERTS_FROM,
  );
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
  const palette = emailPalette(tenant.theme);
  const boardUrl = escapeHtml(origin.replace(/\/$/, "") + "/");
  const unsubUrl = escapeHtml(unsubscribeUrl);
  const boardLabel =
    tenant.brand.hubLabel?.trim() || tenant.brand.name.trim();
  const networkLine = tenant.brand.networkCredit
    ? `${tenant.brand.name}, ${tenant.brand.networkCredit}`
    : tenant.brand.name;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@400;500&amp;family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&amp;display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${palette.mist};color:${palette.navy};font-family:Archivo,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${palette.mist};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${palette.paper};border:1px solid ${palette.rule};">
          <tr>
            <td style="padding:16px 22px;background:${palette.navy};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:11px;">${logoMarkImg(origin, 24)}</td>
                        <td style="vertical-align:middle;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:17px;line-height:1.2;font-weight:700;letter-spacing:-0.03em;">
                          <a href="${boardUrl}" style="text-decoration:none;color:#FFFFFF;">Niche Board</a>
                        </td>
                        <td style="vertical-align:middle;padding:0 10px;">
                          <span style="display:inline-block;width:1px;height:16px;background:rgba(255,255,255,0.3);"></span>
                        </td>
                        <td style="vertical-align:middle;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:17px;line-height:1.2;font-weight:500;letter-spacing:-0.02em;color:#FFFFFF;">
                          <a href="${boardUrl}" style="text-decoration:none;color:#FFFFFF;">${escapeHtml(boardLabel)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10px;line-height:1.4;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.66);max-width:180px;">
                    ${escapeHtml(tenant.copy.contrast)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 24px;">
              <h1 style="margin:0 0 16px;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:600;letter-spacing:-0.02em;color:${palette.navy};">
                ${escapeHtml(title)}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;border-top:1px solid ${palette.rule};">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 16px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">${logoRoundelImg(origin, 20)}</td>
                  <td style="vertical-align:middle;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.45;color:${palette.navy};">
                    <span style="font-weight:600;">Niche Board</span><br />
                    <span style="font-family:Newsreader,Georgia,serif;font-style:italic;font-size:14px;color:${palette.slate};">${escapeHtml(NETWORK_TAGLINE)}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:${palette.slate};">
                ${escapeHtml(footerNote)}
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:${palette.slate};">
                ${escapeHtml(networkLine)}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:${palette.slate};">
                <a href="${unsubUrl}" style="color:${palette.slate};text-decoration:underline;">Unsubscribe</a>
                ·
                <a href="${boardUrl}" style="color:${palette.teal};text-decoration:none;">${escapeHtml(tenant.brand.name)}</a>
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
    networkLine,
    NETWORK_TAGLINE,
    `Browse roles: ${origin.replace(/\/$/, "")}/`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

function ctaButton(
  href: string,
  label: string,
  navy: string,
  paper: string,
): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:16px 0 0;padding:10px 16px;background:${navy};color:${paper};text-decoration:none;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;border-radius:3px;">${escapeHtml(label)}</a>`;
}

function jobCardsHtml(
  jobs: DigestJob[],
  theme: VerticalTenant["theme"],
): string {
  const palette = emailPalette(theme);

  return jobs
    .map((job) => {
      const niche = formatNiche(job.niche);
      const meta = [
        escapeHtml(job.location),
        job.remote ? "Remote / hybrid" : null,
        niche ? escapeHtml(niche) : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:${palette.paper};border:1px solid ${palette.rule};border-left:3px solid ${palette.rail};">
  <tr>
    <td style="padding:0;">
      <a href="${escapeHtml(job.url)}" style="display:block;padding:14px 16px;color:inherit;text-decoration:none;">
        <p style="margin:0;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.06em;color:${palette.slate};">${escapeHtml(job.company)}</p>
        <h2 style="margin:4px 0 8px;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:18px;line-height:1.3;font-weight:600;letter-spacing:-0.015em;color:${palette.navy};">
          ${escapeHtml(job.title)}
        </h2>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.45;color:${palette.slate};">${meta}</p>
        <span style="font-size:13px;font-weight:500;color:${palette.teal};">View role →</span>
      </a>
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
  unsubscribeUrl?: string;
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
      headers?: Record<string, string>;
    } = {
      from: fromAddress(input.tenant),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
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
    if (input.unsubscribeUrl) {
      payload.headers = {
        "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      };
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
  const palette = emailPalette(input.tenant.theme);
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${palette.navy};max-width:42rem;">
      Confirm your alert for <strong>${escapeHtml(input.tenant.copy.contrast)}</strong>.
      We’ll email you when matching roles appear on ${escapeHtml(input.tenant.brand.name)}.
    </p>
    ${ctaButton(input.confirmUrl, "Confirm alerts", palette.navy, palette.paper)}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:${palette.slate};">
      If you did not request this, ignore the message or
      <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${palette.slate};text-decoration:underline;">unsubscribe</a>.
    </p>
  `;
  const shell = brandShell({
    tenant: input.tenant,
    origin: input.origin,
    preheader: `Confirm your ${input.tenant.brand.name} alerts.`,
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

export function buildWelcomeEmail(input: {
  tenant: VerticalTenant;
  origin: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  const palette = emailPalette(input.tenant.theme);
  const boardUrl = `${input.origin.replace(/\/$/, "")}/`;
  const { brand, copy } = input.tenant;
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${palette.navy};max-width:42rem;">
      ${escapeHtml(copy.alertsWelcomeIntro)}
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${palette.navy};max-width:42rem;">
      ${escapeHtml(copy.alertsWelcomeBody)}
    </p>
    ${ctaButton(boardUrl, `Browse ${brand.name}`, palette.navy, palette.paper)}
  `;
  const shell = brandShell({
    tenant: input.tenant,
    origin: input.origin,
    preheader: `${copy.contrast} Short digests when new roles appear.`,
    title: copy.alertsWelcomeTitle,
    bodyHtml,
    footerNote: brand.footer,
    unsubscribeUrl: input.unsubscribeUrl,
  });
  return {
    subject: copy.alertsWelcomeSubject,
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
  const palette = emailPalette(input.tenant.theme);
  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:${palette.navy};">
      ${escapeHtml(input.tenant.copy.alertsDigestIntro)}
    </p>
    ${jobCardsHtml(input.jobs, input.tenant.theme)}
    ${ctaButton(`${input.origin.replace(/\/$/, "")}/`, `Browse ${input.tenant.brand.name}`, palette.navy, palette.paper)}
  `;
  const textJobs = input.jobs
    .map(
      (job) =>
        `- ${job.title} · ${job.company} · ${job.location}\n  ${job.url}`,
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

export async function sendWelcomeEmail(input: {
  tenant: VerticalTenant;
  to: string;
  origin: string;
  unsubscribeUrl: string;
}): Promise<MailResult> {
  const message = buildWelcomeEmail(input);
  return sendMail({
    tenant: input.tenant,
    to: input.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    unsubscribeUrl: input.unsubscribeUrl,
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
    unsubscribeUrl: input.unsubscribeUrl,
  });
}

export { resendConfigured };
