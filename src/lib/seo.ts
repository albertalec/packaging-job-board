import type { Metadata } from "next";
import type { NormalizedJob } from "../../ingest/types";
import {
  isLocalHost,
  isPreviewHost,
  normalizeHost,
  requestOrigin,
  type Tenant,
} from "@config/tenants";
import { jobState } from "./states";
import { requestHostAndProto } from "./tenant";
import { toIsoDate } from "./posted-at";

export { postedTimestamp, toIsoDate } from "./posted-at";

export type PageMetaInput = {
  tenant: Tenant;
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export async function absoluteUrl(tenant: Tenant, path = "/"): Promise<string> {
  const normalized = normalizePath(path);
  const { hostHeader, proto } = await requestHostAndProto();
  const hostname = normalizeHost(hostHeader);
  if (isLocalHost(hostname) || isPreviewHost(hostname)) {
    const origin = requestOrigin({ hostHeader, proto });
    return normalized === "/" ? origin : `${origin}${normalized}`;
  }
  const origin = `https://${tenant.canonicalHost}`;
  return normalized === "/" ? origin : `${origin}${normalized}`;
}

export async function buildPageMetadata({
  tenant,
  title,
  description,
  path,
  index = true,
}: PageMetaInput): Promise<Metadata> {
  const url = await absoluteUrl(tenant, path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: tenant.brand.name,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function parseSalary(salary: string | null | undefined): {
  currency: string;
  minValue?: number;
  maxValue?: number;
  unitText: "YEAR" | "HOUR" | "MONTH" | "WEEK";
  raw: string;
} | null {
  if (!salary) return null;
  const text = salary.replace(/,/g, "");
  const currency = /€/.test(salary) ? "EUR" : /£/.test(salary) ? "GBP" : "USD";
  const numbers = [...text.matchAll(/(\d+(?:\.\d+)?)/g)]
    .map((match) => Number.parseFloat(match[1]))
    .filter((value) => !Number.isNaN(value) && value >= 10);

  if (numbers.length === 0) return null;

  const unitText = /\bhour\b|\bhr\b|\/hr/i.test(salary)
    ? "HOUR"
    : /\bmonth\b|\/mo/i.test(salary)
      ? "MONTH"
      : /\bweek\b/i.test(salary)
        ? "WEEK"
        : "YEAR";

  const minValue = Math.min(...numbers);
  const maxValue = Math.max(...numbers);
  return {
    currency,
    minValue,
    maxValue: maxValue === minValue ? undefined : maxValue,
    unitText,
    raw: salary,
  };
}

export function cityFromLocation(location: string): string | null {
  const first = location.split(",")[0]?.trim();
  if (!first) return null;
  if (/^(united states|u\.s\.a?\.?|usa|remote)$/i.test(first)) return null;
  return first;
}

export function buildJobPostingJsonLd(
  job: NormalizedJob,
  pageUrl: string,
): Record<string, unknown> {
  const description = (job.description || `${job.title} at ${job.company}`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  const datePosted = toIsoDate(job.postedAt);
  const state = jobState(job);
  const city = cityFromLocation(job.location);
  const salary = parseSalary(job.salary);

  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressCountry: "US",
  };
  if (city) address.addressLocality = city;
  if (state) address.addressRegion = state;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    identifier: {
      "@type": "PropertyValue",
      name: job.company,
      value: job.id,
    },
    jobLocation: {
      "@type": "Place",
      address,
    },
    url: pageUrl,
    directApply: true,
  };

  if (datePosted) jsonLd.datePosted = datePosted;

  if (job.remote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = {
      "@type": "Country",
      name: "USA",
    };
  }

  if (salary) {
    const value: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText: salary.unitText,
    };
    if (salary.minValue !== undefined) value.minValue = salary.minValue;
    if (salary.maxValue !== undefined) value.maxValue = salary.maxValue;
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: salary.currency,
      value,
    };
  }

  return jsonLd;
}
