/**
 * Client-safe brand constants (NEXT_PUBLIC_* inlined at build time).
 * Server code should prefer `@/lib/site` helpers when possible.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Packaging Job Board",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "packagingjobboard.com",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@packagingjobboard.com",
  markLine1: process.env.NEXT_PUBLIC_SITE_MARK_LINE_1 ?? "Packaging",
  markLine2: process.env.NEXT_PUBLIC_SITE_MARK_LINE_2 ?? "Job Board",
} as const;
