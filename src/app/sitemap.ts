import type { MetadataRoute } from "next";
import { loadJobs } from "@/lib/jobs";

export default function sitemap(): MetadataRoute.Sitemap {
  const { jobs } = loadJobs();
  return [
    { url: "https://packagingjobs.local/", lastModified: new Date() },
    ...jobs.map((job) => {
      const parsed = job.postedAt ? Date.parse(job.postedAt) : Number.NaN;
      return {
        url: `https://packagingjobs.local/jobs/${job.id}`,
        lastModified: Number.isNaN(parsed) ? new Date() : new Date(parsed),
      };
    }),
  ];
}
