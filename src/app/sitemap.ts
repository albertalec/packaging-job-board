import type { MetadataRoute } from "next";
import { loadJobs } from "@/lib/jobs";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const { jobs } = loadJobs();
  return [
    { url: `${origin}/`, lastModified: new Date() },
    ...jobs.map((job) => {
      const parsed = job.postedAt ? Date.parse(job.postedAt) : Number.NaN;
      return {
        url: `${origin}/jobs/${job.id}`,
        lastModified: Number.isNaN(parsed) ? new Date() : new Date(parsed),
      };
    }),
  ];
}
