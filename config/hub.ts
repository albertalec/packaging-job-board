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
    tagline: "The right jobs, not all the jobs.",
    lockupLine: "Precision job boards for specialists.",
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
    lede: "One network of specialty boards — each built for a narrow professional slice generic sites bury. Candidates apply on the employer career site. Employers pin a listing they already have.",
    metaDescription:
      "Niche Board is a network of precision job boards for specialists. The right jobs, not all the jobs. Pin an ATS listing on the board that reaches the role you are hiring.",
  },
};
