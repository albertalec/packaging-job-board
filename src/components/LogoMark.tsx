type LogoMarkProps = {
  className?: string;
  size?: number;
  /** Avatar variant: white frame on navy circle background */
  variant?: "default" | "avatar";
};

/**
 * Geometric Niche Board icon — navy frame, open bottom-left corner, teal triangle.
 * Matches brand logo lockup (corner triangle points inward).
 */
export function LogoMark({
  className,
  size = 40,
  variant = "default",
}: LogoMarkProps) {
  const frameStroke = variant === "avatar" ? "#FFFFFF" : "var(--navy, #0D1B2A)";
  const triangleFill = "var(--teal, #0D7D77)";

  const icon = (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {variant === "avatar" ? (
        <circle cx="20" cy="20" r="20" fill="var(--navy, #0D1B2A)" />
      ) : null}
      {/* Frame with open bottom-left corner */}
      <path
        d="M10 10H30V30H18M10 10V22"
        stroke={frameStroke}
        strokeWidth="3"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Teal triangle in open corner */}
      <path d="M10 22L10 30L18 30Z" fill={triangleFill} />
    </svg>
  );

  return icon;
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
