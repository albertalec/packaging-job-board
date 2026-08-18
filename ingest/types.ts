export type Niche =
  | "automotive"
  | "pharma"
  | "cpg"
  | "food-beverage"
  | "industrial";

export type Ats =
  | "workday"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "amazon"
  | "phenom"
  | "successfactors"
  | "smartrecruiters";

export type Company = {
  name: string;
  slug: string;
  ats: Ats;
  careerUrl: string;
  niche?: Niche;
  searchText?: string;
  host?: string;
  tenant?: string;
  site?: string;
  boardToken?: string;
  country?: string;
};

export type NormalizedJob = {
  id: string;
  sourceId: string;
  hash: string;
  company: string;
  companySlug: string;
  title: string;
  department: string | null;
  location: string;
  remote: boolean;
  postedAt: string | null;
  applyUrl: string;
  description: string;
  salary: string | null;
  niche: Niche | null;
  source: Ats;
};
