import type { HubTenant } from "./types";

export const hub: HubTenant = {
  kind: "hub",
  id: "hub",
  hosts: [
    "nicheboardjobs.com",
    "www.nicheboardjobs.com",
    "nicheboard.localhost",
  ],
  canonicalHost: "nicheboardjobs.com",
  localHost: "nicheboard.localhost",
  brand: {
    name: "Niche Board",
    markLine1: "Niche",
    markLine2: "Board",
    tagline: "The right jobs. Not all the jobs.",
    employerTagline: "Pin a live listing on the specialty board that reaches your role.",
    footer:
      "Precision job boards for specialists. Candidates apply on the employer ATS.",
    employerFooter:
      "Pin a listing you already have on Workday or Greenhouse — scoped to one specialty board.",
  },
  theme: {
    accent: "#0D7D77",
    kraft: "#F1F3F5",
    paper: "#FFFFFF",
    navy: "#0D1B2A",
    teal: "#0D7D77",
    amber: "#F5A623",
    slate: "#4B5563",
    mist: "#F1F3F5",
  },
  contactEmail: "hello@nicheboardjobs.com",
  copy: {
    hero: "Precision job boards for specialists.",
    lede:
      "Specialty boards for narrow professional slices — classified daily from employer career sites. Apply on the company’s ATS, not through us.",
    boardsHeadline: "Browse a specialty board",
    boardsIntro:
      "Each board is built for one niche — its own filters, classifier, and sponsorship pool.",
    metaDescription:
      "Niche Board is a network of precision job boards for specialists. The right jobs, not all the jobs. Pin an ATS listing on the board that reaches the role you are hiring.",
    pillars: [
      {
        title: "Filtered",
        body: "Specialist titles only — we drop the noise generic boards keep.",
        accent: "navy",
      },
      {
        title: "Fresh",
        body: "Updated daily from employer ATS feeds, not stale reposts.",
        accent: "teal",
      },
      {
        title: "Apply-out",
        body: "Finish on the company career site — no fake apply wall.",
        accent: "slate",
      },
    ],
  },
};
