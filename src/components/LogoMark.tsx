type LogoMarkProps = {
  className?: string;
  size?: number;
};

/** Geometric Niche Board icon — navy frame, open bottom-right corner, teal triangle. */
export function LogoMark({ className, size = 40 }: LogoMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Frame with open bottom-right corner */}
      <path
        d="M6 6H34V34H22"
        stroke="var(--navy, #0D1B2A)"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M6 6V34"
        stroke="var(--navy, #0D1B2A)"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      {/* Teal triangle in open corner */}
      <path
        d="M22 22L34 34L22 34Z"
        fill="var(--teal, #0D7D77)"
      />
    </svg>
  );
}
