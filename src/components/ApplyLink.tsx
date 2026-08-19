"use client";

import type { ReactNode } from "react";

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | undefined> },
    ) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

type ApplyLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  jobId?: string;
  company?: string;
};

function trackApplyClick(jobId?: string, company?: string) {
  const props = { job_id: jobId, company };
  window.plausible?.("Apply Click", { props });
  window.gtag?.("event", "apply_click", props);
}

export function ApplyLink({
  href,
  className,
  children,
  jobId,
  company,
}: ApplyLinkProps) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackApplyClick(jobId, company)}
    >
      {children}
    </a>
  );
}
