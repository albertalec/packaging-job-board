export type Theme = {
  accent: string;
  kraft: string;
  paper: string;
  /** Brand Guide v1 palette — hub and future vertical rebrand */
  navy?: string;
  teal?: string;
  amber?: string;
  slate?: string;
  mist?: string;
};

export type Brand = {
  name: string;
  markLine1: string;
  markLine2: string;
  tagline: string;
  /** Uppercase line under the hub wordmark in the logo lockup */
  lockupLine?: string;
  employerTagline: string;
  footer: string;
  employerFooter: string;
  /** Short niche name for hub cards — e.g. "Packaging" */
  hubLabel?: string;
  /** e.g. "powered by Niche Board" — vertical boards only */
  networkCredit?: string;
  /** Inbox From display name for alert emails */
  alertsFromName?: string;
};

export type SponsorConfig = {
  priceCents: number;
  durationDays: number;
  maxFeatured: number;
  maxHomepage: number;
};

export type VerticalCopy = {
  hero: string;
  lede: string;
  contrast: string;
  metaDescription: string;
  empty: string;
  emptyFiltered: string;
  sponsorHeadline: string;
  sponsorLede: string;
  kicker: string;
  alertsTitle: string;
  alertsLede: string;
  alertsWelcomeSubject: string;
  alertsWelcomeTitle: string;
  alertsWelcomeIntro: string;
  alertsWelcomeBody: string;
  alertsDigestIntro: string;
};

export type VerticalTenant = {
  kind: "vertical";
  id: string;
  hosts: string[];
  canonicalHost: string;
  localHost: string;
  brand: Brand;
  theme: Theme;
  contactEmail: string;
  copy: VerticalCopy;
  ingest: {
    classifier: string;
  };
  dataFile: string;
  sponsor: SponsorConfig;
  filters: string[];
};

export type HubTenant = {
  kind: "hub";
  id: "hub";
  hosts: string[];
  canonicalHost: string;
  localHost: string;
  brand: Brand;
  theme: Theme;
  contactEmail: string;
  copy: {
    hero: string;
    lede: string;
    metaDescription: string;
  };
};

export type Tenant = VerticalTenant | HubTenant;

export type TenantEnv = {
  TENANT_HOST?: string;
  DEFAULT_VERTICAL?: string;
};
