import type { NormalizedJob } from "../../ingest/types";
import { parsePostedAt, toIsoDate } from "@/lib/job-dates";
import { absoluteUrl } from "@/lib/seo";
import { siteName } from "@/lib/site";

const MAX_DESCRIPTION_LENGTH = 5000;

function truncateDescription(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`;
}

function locationAddress(job: NormalizedJob) {
  const parts = job.location.split(",").map((part) => part.trim()).filter(Boolean);
  const city = parts[0] ?? job.location;
  const region = job.state ?? parts[1] ?? undefined;
  return {
    "@type": "PostalAddress" as const,
    addressLocality: city,
    ...(region ? { addressRegion: region } : {}),
    addressCountry: "US",
  };
}

export function buildJobPostingJsonLd(job: NormalizedJob): Record<string, unknown> {
  const posted = parsePostedAt(job.postedAt);
  const datePosted = toIsoDate(posted);
  const pageUrl = absoluteUrl(`/jobs/${job.id}`);

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: truncateDescription(job.description),
    identifier: {
      "@type": "PropertyValue",
      name: siteName(),
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    url: pageUrl,
    directApply: true,
  };

  if (datePosted) payload.datePosted = datePosted;

  if (job.remote) {
    payload.jobLocationType = "TELECOMMUTE";
    payload.applicantLocationRequirements = {
      "@type": "Country",
      name: "US",
    };
  } else {
    payload.jobLocation = {
      "@type": "Place",
      address: locationAddress(job),
    };
  }

  return payload;
}
