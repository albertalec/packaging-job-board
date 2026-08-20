import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pages call headers() for multi-tenant routing, so they render on the
  // serverless runtime. NFT cannot see dynamic `tenant.dataFile` paths —
  // without this include, loadJobs hits ENOENT and the board shows empty.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },
};

export default nextConfig;
