import {
  BRAND,
  LOGO_CORNER_PATH,
  LOGO_FRAME_PATH,
  LOGO_STROKE_WIDTH,
  LOGO_VIEWBOX,
} from "./logo-paths";

type LogoMarkProps = {
  className?: string;
  size?: number;
  /** Avatar variant: white frame on navy circle background */
  variant?: "default" | "avatar";
};

/**
 * Niche Board geometric mark — navy frame with open bottom-right corner
 * and rounded teal selected-corner triangle.
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
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={LOGO_CORNER_PATH} fill={BRAND.teal} />
    </svg>
  );
}

type HubLogoLockupProps = {
  name: string;
  lockupLine?: string;
  className?: string;
};

/** Horizontal logo: icon + wordmark + uppercase positioning line. */
export function HubLogoLockup({ name, lockupLine, className }: HubLogoLockupProps) {
  const line = lockupLine?.trim();
  const specialistsMatch = line?.match(/^(.*?)(specialists\.?)$/i);

  return (
    <span className={className}>
      <LogoMark className="mark-icon" size={44} />
      <span className="mark-text">
        <span className="mark-word">{name}</span>
        {line ? (
          <span className="mark-lockup" aria-hidden="true">
            {specialistsMatch ? (
              <>
                {specialistsMatch[1].toUpperCase()}
                <span className="mark-lockup-accent">
                  {specialistsMatch[2].toUpperCase()}
                </span>
              </>
            ) : (
              line.toUpperCase()
            )}
          </span>
        ) : null}
      </span>
    </span>
  );
}
