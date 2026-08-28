import { CONTACT_EMAIL } from "./email";
import type { VerticalTenant } from "./types";

export const packaging: VerticalTenant = {
  kind: "vertical",
  id: "packaging",
  hosts: ["packaging.nicheboardjobs.com", "packaging.localhost"],
  canonicalHost: "packaging.nicheboardjobs.com",
  localHost: "packaging.localhost",
  brand: {
    name: "Packaging Jobs",
    markLine1: "Niche Board",
    markLine2: "",
    hubLabel: "Packaging",
    tagline: "Package development — not plant ops.",
    employerTagline: "Pin a live listing on the Packaging board.",
    footer: "Roles from employer career sites. Apply on the source listing.",
    employerFooter:
      "Pin a listing you already have — scoped to the Packaging board. Candidates apply on the employer ATS.",
    networkCredit: "powered by Niche Board",
    alertsFromName: "Packaging Jobs Alerts",
  },
  theme: {
    accent: "#0D7D77",
    kraft: "#D9C3A0",
    paper: "#FFFFFF",
    navy: "#0D1B2A",
    teal: "#0D7D77",
    amber: "#F5A623",
    slate: "#4B5563",
    mist: "#F1F3F5",
  },
  contactEmail: CONTACT_EMAIL,
  copy: {
    kicker: "Updated daily",
    hero: "Packaging engineer roles, checked by hand.",
    lede: "Open roles at brand employers. Pulled daily from employer ATS feeds. You apply on the company's career site.",
    contrast: "Package development — not plant ops.",
    metaDescription:
      "Packaging engineer and package-development roles at CPG and brand employers. Updated daily from employer ATS feeds. Apply on the company career site.",
    empty:
      "No packaging engineer roles listed right now. We'll have more after the next daily update.",
    emptyFiltered: "No roles match those filters. Try widening them.",
    sponsorPanelTitle: "Hiring a packaging engineer?",
    sponsorHeadline: "to pin a listing for",
    sponsorLede:
      "Reach packaging engineers who browse this board. Pin a live career-site listing for 30 days — no separate posting workflow.",
    alertsTitle: "Get new packaging roles by email",
    alertsLede:
      "A short digest when fresh package-development jobs show up. Filter it to your sector and state. Nothing on a slow week.",
    alertsWelcomeSubject: "You're subscribed to Packaging Jobs alerts",
    alertsWelcomeTitle: "You're on the list",
    alertsWelcomeIntro:
      "You're subscribed to Packaging Jobs alerts, powered by Niche Board.",
    alertsWelcomeBody:
      "We'll send a short digest when new package-development roles appear. Package development — not plant ops.",
    alertsDigestIntro: "New roles on Packaging Jobs — view details on the board.",
    boardSpecTitle: "Board Specification",
    boardSpecParagraphs: [
      "As a packaging professional, you know the impact of matching the spec to the conditions—ECT, flute, geometry.",
      "That's what Niche Board does for your career.",
      "We filter out the noise and surface curated jobs selected for your professional niche—so you spend less time searching and more time finding the right fit.",
    ],
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
