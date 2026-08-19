import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/site";

export function absoluteUrl(path: string): string {
  const base = siteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

/** Indexable page metadata with canonical, Open Graph, and Twitter cards. */
export function indexPageMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const name = siteName();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: name,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/** Employer checkout pages — keep out of search results. */
export function sponsorNoIndexMetadata({
  title,
  description,
}: Omit<PageMetadataInput, "path">): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}

export function googleSiteVerification(): string | undefined {
  return process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;
}
