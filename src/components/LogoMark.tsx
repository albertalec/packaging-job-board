import {
  BRAND,
  LOGO_CORNER_PATH,
  LOGO_FRAME_PATH,
  LOGO_STROKE_WIDTH,
  LOGO_VIEWBOX,
  splitTagline,
} from "./logo-paths";

type LogoMarkProps = {
  className?: string;
  size?: number;
  /** Avatar variant: white frame on navy circle background */
  variant?: "default" | "avatar";
};

/**
 * Niche Board geometric mark — navy frame open at top-right,
 * solid teal triangle in the bottom-right corner.
 */
export function LogoMark({
  className,
  size = 48,
  variant = "default",
}: LogoMarkProps) {
  const frameStroke = variant === "avatar" ? "#FFFFFF" : BRAND.navy;

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
      {variant === "avatar" ? (
        <circle cx="24" cy="24" r="24" fill={BRAND.navy} />
      ) : null}
      <path
        d={LOGO_FRAME_PATH}
        stroke={frameStroke}
        strokeWidth={LOGO_STROKE_WIDTH}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d={LOGO_CORNER_PATH} fill={BRAND.teal} />
    </svg>
  );
}

type HubLogoLockupProps = {
  markLine1: string;
  markLine2: string;
  tagline: string;
  className?: string;
};

/** Primary logo lockup — icon, stacked wordmark, two-tone tagline. */
export function HubLogoLockup({
  markLine1,
  markLine2,
  tagline,
  className,
}: HubLogoLockupProps) {
  const { lead, accent } = splitTagline(tagline);

  return (
    <span className={className ?? "hub-logo-lockup"}>
      <span className="hub-logo-row">
        <LogoMark className="mark-icon" size={48} />
        <span className="mark-wordstack" aria-hidden="true">
          <span className="mark-line">{markLine1}</span>
          <span className="mark-line">{markLine2}</span>
        </span>
      </span>
      <span className="mark-tagline">
        {lead}
        {accent ? <span className="mark-tagline-accent"> {accent}</span> : null}
      </span>
    </span>
  );
}
