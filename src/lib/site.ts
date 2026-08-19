/** Brand and URL defaults — override via env when the final name/domain is chosen. See PLAN.md §1d. */
const DEFAULT_SITE_NAME = "Packaging Job Board";
const DEFAULT_SITE_DOMAIN = "packagingjobboard.com";

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Public site origin (Stripe redirects, sitemap, canonical). */
export function siteUrl(): string {
  const explicit = readEnv("SITE_URL", "NEXT_PUBLIC_SITE_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const domain = siteDomain();
  if (domain && domain !== DEFAULT_SITE_DOMAIN) return `https://${domain}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Display name used in titles, Stripe copy, and structured data. */
export function siteName(): string {
  return readEnv("SITE_NAME", "NEXT_PUBLIC_SITE_NAME") ?? DEFAULT_SITE_NAME;
}

/** Production domain without protocol (e.g. packagingjobboard.com). */
export function siteDomain(): string {
  return readEnv("SITE_DOMAIN", "NEXT_PUBLIC_SITE_DOMAIN") ?? DEFAULT_SITE_DOMAIN;
}

/** Public contact inbox — defaults to hello@{siteDomain}. */
export function contactEmail(): string {
  return readEnv("CONTACT_EMAIL", "NEXT_PUBLIC_CONTACT_EMAIL") ?? `hello@${siteDomain()}`;
}

/** Masthead lines; optional SITE_MARK_LINES="Line one|Line two" or per-line env vars. */
export function siteMarkLines(): [string, string] {
  const combined = readEnv("SITE_MARK_LINES", "NEXT_PUBLIC_SITE_MARK_LINES");
  if (combined) {
    const [first, second] = combined.split("|");
    if (first?.trim() && second?.trim()) return [first.trim(), second.trim()];
  }
  const line1 = readEnv("SITE_MARK_LINE_1", "NEXT_PUBLIC_SITE_MARK_LINE_1");
  const line2 = readEnv("SITE_MARK_LINE_2", "NEXT_PUBLIC_SITE_MARK_LINE_2");
  if (line1 && line2) return [line1, line2];
  const name = siteName();
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
  }
  return [name, ""];
}
