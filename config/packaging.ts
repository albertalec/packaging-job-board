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
    employerTagline: "Pin an existing listing at the top of the board.",
    footer:
      "Packaging engineer roles from employer career sites. Apply on the source listing.",
    employerFooter:
      "Pin a live career-site listing. Candidates apply on the employer ATS.",
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
    lede: "Packaging engineers and package development — not plant ops. Open roles at companies like General Mills, Johnson & Johnson, Mars, and Clorox. Apply on the company's career site.",
    contrast: "Package development — not plant ops.",
    metaDescription:
      "Packaging engineer and package-development jobs at CPG and brand employers. Updated daily. Apply on the company career site.",
    empty:
      "No packaging engineer roles listed right now. Check back after the next daily update.",
    emptyFiltered: "No packaging engineer roles match.",
    sponsorHeadline: "to pin a listing for",
    sponsorLede:
      "Packaging engineers and package-development candidates already use this board. Pay by card to pin a live career-site listing at the top — no separate \"post a job\" round-trip.",
    alertsTitle: "Get new packaging engineer roles by email",
    alertsLede:
      "No paywall. Enter your email and you’re on the list — we’ll send a short digest when fresh package-development jobs appear.",
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
