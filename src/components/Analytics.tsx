import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

/** Page views via Vercel Web Analytics (enable in the Vercel project dashboard). */
export function Analytics() {
  return <VercelAnalytics />;
}
