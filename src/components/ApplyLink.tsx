"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { track } from "@vercel/analytics";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  company?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className" | "onClick">;

/** Outbound apply link; fires a Vercel Analytics custom event on click. */
export function ApplyLink({ href, children, className, company, ...rest }: Props) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        track("Apply", company ? { company } : undefined);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
