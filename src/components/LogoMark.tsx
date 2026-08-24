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

type LogoMarkProps = {
  className?: string;
  size?: number;
  /** Roundel variant for avatars, favicons, and stamps */
  variant?: "default" | "avatar";
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
  if (variant === "avatar") {
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
        <circle cx="400" cy="400" r="400" fill={BRAND.navy} />
        <path d={LOGO_ROUNDEL_NAVY_PATH} fill="#FFFFFF" />
        <path d={LOGO_ROUNDEL_TEAL_PATH} fill={BRAND.teal} />
      </svg>
    );
  }

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
      <path d={LOGO_NAVY_PATH} fill={BRAND.navy} />
      <path d={LOGO_TEAL_PATH} fill={BRAND.teal} />
    </svg>
  );
}

type HubLogoLockupProps = {
  name: string;
  kicker: string;
  tagline?: string;
  className?: string;
};

/** Primary lockup — symbol, single-line wordmark, uppercase kicker. */
export function HubLogoLockup({
  name,
  kicker,
  tagline,
  className,
}: HubLogoLockupProps) {
  const kickerParts = splitKicker(kicker);
  const taglineParts = tagline ? splitTagline(tagline) : null;

  return (
    <span className={className ?? "hub-logo-lockup"}>
      <span className="hub-logo-row">
        <LogoMark className="mark-icon" size={48} />
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
