import {
  BRAND,
  LOGO_NAVY_PATH,
  LOGO_ROUNDEL_NAVY_PATH,
  LOGO_ROUNDEL_TEAL_PATH,
  LOGO_ROUNDEL_VIEWBOX,
  LOGO_TEAL_PATH,
  LOGO_VIEWBOX,
  splitKicker,
  splitTagline,
} from "./logo-paths";

export type LogoMarkVariant =
  | "default"
  | "reverse"
  | "mono-navy"
  | "mono-white"
  | "avatar"
  | "avatar-white"
  | "avatar-teal"
  | "avatar-outline"
  | "on-navy";

type LogoMarkProps = {
  className?: string;
  size?: number;
  variant?: LogoMarkVariant;
};

/**
 * Niche Board symbol — two crop marks. Navy opens the frame, teal closes it.
 * The gap between corners is structural and must not be closed.
 */
export function LogoMark({
  className,
  size = 48,
  variant = "default",
}: LogoMarkProps) {
  if (variant === "on-navy") {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="512" height="512" rx="96" fill={BRAND.navy} />
        <g transform="translate(138 138)">
          <path d={LOGO_NAVY_PATH} fill="#FFFFFF" />
          <path d={LOGO_TEAL_PATH} fill={BRAND.teal} />
        </g>
      </svg>
    );
  }

  if (variant.startsWith("avatar")) {
    const fills =
      variant === "avatar-white"
        ? { bg: "#FFFFFF", navy: BRAND.navy, teal: BRAND.teal }
        : variant === "avatar-teal"
          ? { bg: BRAND.teal, navy: "#FFFFFF", teal: "rgba(255,255,255,0.5)" }
          : variant === "avatar-outline"
            ? { bg: "#FFFFFF", navy: BRAND.navy, teal: BRAND.teal, stroke: BRAND.navy }
            : { bg: BRAND.navy, navy: "#FFFFFF", teal: BRAND.teal };

    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox={LOGO_ROUNDEL_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {"stroke" in fills ? (
          <circle
            cx="400"
            cy="400"
            r="392"
            fill={fills.bg}
            stroke={fills.stroke}
            strokeWidth="16"
          />
        ) : (
          <circle cx="400" cy="400" r="400" fill={fills.bg} />
        )}
        <path d={LOGO_ROUNDEL_NAVY_PATH} fill={fills.navy} />
        <path d={LOGO_ROUNDEL_TEAL_PATH} fill={fills.teal} />
      </svg>
    );
  }

  const navyFill =
    variant === "reverse" || variant === "mono-white"
      ? "#FFFFFF"
      : BRAND.navy;
  const tealFill =
    variant === "mono-navy"
      ? BRAND.navy
      : variant === "mono-white"
        ? "#FFFFFF"
        : BRAND.teal;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={LOGO_NAVY_PATH} fill={navyFill} />
      <path d={LOGO_TEAL_PATH} fill={tealFill} />
    </svg>
  );
}

type HubLogoLockupProps = {
  name: string;
  kicker: string;
  tagline?: string;
  className?: string;
  /** Use reverse (light) symbol on dark backgrounds */
  reverse?: boolean;
};

/** Primary lockup — symbol, single-line wordmark, uppercase kicker. */
export function HubLogoLockup({
  name,
  kicker,
  tagline,
  className,
  reverse = false,
}: HubLogoLockupProps) {
  const kickerParts = splitKicker(kicker);
  const taglineParts = tagline ? splitTagline(tagline) : null;

  return (
    <span className={className ?? "hub-logo-lockup"}>
      <span className="hub-logo-row">
        <LogoMark
          className="mark-icon"
          size={48}
          variant={reverse ? "reverse" : "default"}
        />
        <span className="mark-wordmark">{name}</span>
      </span>
      <span className="mark-kicker">
        {kickerParts.lead}
        {kickerParts.accent ? (
          <span className="mark-kicker-accent">{kickerParts.accent}</span>
        ) : null}
      </span>
      {taglineParts ? (
        <span className="mark-tagline">
          {taglineParts.lead}
          {taglineParts.accent ? (
            <span className="mark-tagline-accent"> {taglineParts.accent}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
