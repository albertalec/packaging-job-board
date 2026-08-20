import type { MetadataRoute } from "next";
import { loadJobs } from "@/lib/jobs";
import { getRequestTenant, requestHostAndProto } from "@/lib/tenant";
import { requestOrigin } from "@config/tenants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getRequestTenant();
  const { hostHeader, proto } = await requestHostAndProto();
  const origin = requestOrigin({ hostHeader, proto });

  if (tenant.kind === "hub") {
    return [
      { url: `${origin}/`, lastModified: new Date() },
      { url: `${origin}/niches`, lastModified: new Date() },
      { url: `${origin}/employers`, lastModified: new Date() },
    ];
  }

  const { jobs } = loadJobs(tenant.id);
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
