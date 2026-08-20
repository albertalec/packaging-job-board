import type { MetadataRoute } from "next";
import { loadJobs } from "@/lib/jobs";
import { toIsoDate } from "@/lib/seo";
import { getRequestTenant } from "@/lib/tenant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getRequestTenant();
  const origin = `https://${tenant.canonicalHost}`;

  if (tenant.kind === "hub") {
    return [
      { url: `${origin}/`, lastModified: new Date() },
      { url: `${origin}/niches`, lastModified: new Date() },
      { url: `${origin}/employers`, lastModified: new Date() },
    ];
  }

  const { jobs, ingestedAt } = loadJobs(tenant.id);
  const homeModified = ingestedAt ? new Date(ingestedAt) : new Date();

  return [
    { url: `${origin}/`, lastModified: homeModified },
    ...jobs.map((job) => {
      const iso = toIsoDate(job.postedAt);
      return {
        url: `${origin}/jobs/${job.id}`,
        lastModified: iso ? new Date(iso) : homeModified,
      };
    }),
  ];
}
