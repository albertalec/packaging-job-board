import Script from "next/script";

/**
 * Plausible analytics. Enable with NEXT_PUBLIC_PLAUSIBLE=1.
 * data-domain defaults to the tenant canonical host (register each host in Plausible).
 * Override with NEXT_PUBLIC_PLAUSIBLE_DOMAIN if you use one Plausible site for all hosts.
 */
export function Analytics({ domain }: { domain: string }) {
  const enabled =
    process.env.NEXT_PUBLIC_PLAUSIBLE === "1" ||
    Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim());
  if (!enabled) return null;

  const dataDomain =
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || domain;

  return (
    <Script
      defer
      data-domain={dataDomain}
      src="https://plausible.io/js/script.tagged-events.js"
      strategy="afterInteractive"
    />
  );
}
