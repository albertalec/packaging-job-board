import type { VerticalTenant } from "./types";

export const packaging: VerticalTenant = {
  kind: "vertical",
  id: "packaging",
  hosts: ["packaging.nicheboardjobs.com", "packaging.localhost"],
  canonicalHost: "packaging.nicheboardjobs.com",
  localHost: "packaging.localhost",
  brand: {
    name: "Packaging Jobs",
    markLine1: "Packaging",
    markLine2: "Jobs",
    tagline: "Packaging engineer jobs at top employers.",
    employerTagline: "Pin a live listing at the top of Packaging Jobs.",
    footer:
      "Roles from employer career sites. Apply on the source listing.",
    employerFooter:
      "Pin a live career-site listing on Packaging Jobs. Candidates apply on the employer ATS.",
    networkCredit: "powered by Niche Board",
  },
  theme: {
    accent: "#b42318",
    kraft: "#c4a484",
    paper: "#f3eadb",
  },
  contactEmail: "hello@packaging.nicheboardjobs.com",
  copy: {
    kicker: "Updated daily",
    hero: "Packaging engineer jobs at top employers.",
    lede: "Open roles at companies like General Mills, Johnson & Johnson, Mars, and Clorox. Apply on the company’s career site.",
    contrast: "Package development — not plant ops.",
    metaDescription:
      "Packaging engineer and package-development jobs at CPG and brand employers. Updated daily from employer ATS feeds. Apply on the company career site.",
    empty:
      "No packaging engineer roles listed right now. We’ll have more after the next daily update — hang tight.",
    emptyFiltered:
      "No packaging engineer roles match those filters. Try widening them a bit.",
    sponsorHeadline: "to pin a listing for",
    sponsorLede:
      "Reach packaging engineers and package-development folks who already browse Packaging Jobs. Pin a live career-site listing at the top for 30 days — no separate “post a job” round-trip.",
    alertsTitle: "Get new packaging engineer roles by email",
    alertsLede:
      "No paywall. Drop in your email and you’re on the list — we’ll send a short digest when fresh package-development jobs show up.",
    alertsWelcomeSubject: "You’re subscribed to Packaging Jobs alerts",
    alertsWelcomeTitle: "You’re on the list",
    alertsWelcomeIntro:
      "You’re subscribed to Packaging Jobs alerts, powered by Niche Board.",
    alertsWelcomeBody:
      "We’ll send a short digest when new packaging engineer and package-development roles appear. Package development — not plant ops. Browse anytime and apply on the company’s career site.",
  },
  ingest: {
    classifier: "packaging",
  },
  dataFile: "data/packaging/jobs.json",
  sponsor: {
    priceCents: 10_000,
    durationDays: 30,
    maxFeatured: 3,
    maxHomepage: 5,
  },
  filters: ["cpg", "pharma", "automotive", "state", "remote"],
};
