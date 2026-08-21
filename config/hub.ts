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
    tagline: "Jobs in niches too narrow for LinkedIn.",
    employerTagline: "Specialist boards for roles generic sites bury.",
    footer:
      "A network of precision job boards. Candidates apply on the employer ATS.",
    employerFooter:
      "Pin a listing you already have on Workday or Greenhouse — scoped to one specialist board.",
  },
  theme: {
    accent: "#1d4e89",
    kraft: "#8a9bb0",
    paper: "#f4f1ea",
  },
  contactEmail: "hello@nicheboardjobs.com",
  copy: {
    hero: "Jobs in niches too narrow for LinkedIn.",
    lede: "Specialist boards for roles generic sites bury — with a little more signal and a lot less noise. Candidates apply on the employer career site. Employers pin a listing they already have.",
    metaDescription:
      "Niche Board is a network of specialist job boards. Pin an ATS listing on the board that actually reaches the role you are hiring.",
  },
};
