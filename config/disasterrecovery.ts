import { CONTACT_EMAIL } from "./email";
import type { VerticalTenant } from "./types";

export const disasterrecovery: VerticalTenant = {
  kind: "vertical",
  id: "disasterrecovery",
  hosts: [
    "disasterrecovery.nicheboardjobs.com",
    "disasterrecovery.localhost",
  ],
  canonicalHost: "disasterrecovery.nicheboardjobs.com",
  localHost: "disasterrecovery.localhost",
  brand: {
    name: "Resilience Jobs",
    markLine1: "Niche Board",
    markLine2: "",
    hubLabel: "Resilience",
    tagline: "BCM & disaster recovery — not generic IT.",
    employerTagline: "Pin a live listing on the Resilience board.",
    footer: "Roles from employer career sites. Apply on the source listing.",
    employerFooter:
      "Pin a listing you already have — scoped to the Resilience board. Candidates apply on the employer ATS.",
    networkCredit: "powered by Niche Board",
    alertsFromName: "Resilience Jobs Alerts",
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
  contactEmail: CONTACT_EMAIL,
  copy: {
    kicker: "Updated daily",
    hero: "BCM and disaster recovery roles, checked by hand.",
    lede: "Open roles at finance and healthcare employers. Pulled daily from employer ATS feeds. You apply on the company's career site.",
    contrast: "BCM & disaster recovery — not generic IT.",
    metaDescription:
      "Business continuity, BCM, and disaster recovery roles at finance and healthcare employers. Updated daily from employer ATS feeds. Apply on the company career site.",
    empty:
      "No BCM or disaster recovery roles listed right now. We'll have more after the next daily update.",
    emptyFiltered: "No roles match those filters. Try widening them.",
    sponsorHeadline: "to pin a listing for",
    sponsorLede:
      "Reach BCM and DR specialists who browse this board. Pin a live career-site listing for 30 days — no separate posting workflow.",
    alertsTitle: "Get new resilience roles by email",
    alertsLede:
      "A short digest when fresh BCM and disaster-recovery jobs show up. Filter it to your sector and state. Nothing on a slow week.",
    alertsWelcomeSubject: "You're subscribed to Resilience Jobs alerts",
    alertsWelcomeTitle: "You're on the list",
    alertsWelcomeIntro:
      "You're subscribed to Resilience Jobs alerts, powered by Niche Board.",
    alertsWelcomeBody:
      "We'll send a short digest when new BCM and disaster-recovery roles appear. BCM & disaster recovery — not generic IT.",
    alertsDigestIntro: "New roles on Resilience Jobs — view details on the board.",
  },
  ingest: {
    classifier: "disasterrecovery",
  },
  dataFile: "data/disasterrecovery/jobs.json",
  sponsor: {
    priceCents: 17_500,
    durationDays: 30,
    maxFeatured: 3,
    maxHomepage: 5,
  },
  filters: ["finance", "healthcare", "insurance", "state", "remote"],
};
