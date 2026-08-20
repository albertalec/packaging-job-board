import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  company?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className">;

/** Outbound apply link with Plausible tagged-event class when analytics is on. */
export function ApplyLink({ href, children, className, company, ...rest }: Props) {
  const classes = [className, "plausible-event-name=Apply"];
  if (company) {
    classes.push(`plausible-event-company=${sanitizeEventProp(company)}`);
  }
  return (
    <a
      href={href}
      className={classes.filter(Boolean).join(" ")}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  );
}

function sanitizeEventProp(value: string): string {
  return value.replace(/\s+/g, "+").replace(/[^a-zA-Z0-9+_.:-]/g, "").slice(0, 64);
}
