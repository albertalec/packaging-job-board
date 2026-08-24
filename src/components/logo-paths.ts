/** Brand Guide v1 — geometric mark paths (48×48 artboard). */
export const BRAND = {
  navy: "#0D1B2A",
  teal: "#0D7D77",
} as const;

/**
 * Navy frame — top, left, bottom, and partial right.
 * Open at the top-right corner (brand sheet primary logo).
 */
export const LOGO_FRAME_PATH =
  "M10 10H28M10 10V38M10 38H38M38 38V28";

/** Teal triangle nestled in the bottom-right inside the frame. */
export const LOGO_CORNER_PATH = "M28 38L38 38L38 28Z";

export const LOGO_VIEWBOX = "0 0 48 48";
export const LOGO_STROKE_WIDTH = 4;

/** Split tagline for two-tone lockup: navy lead-in, teal accent. */
export function splitTagline(tagline: string): { lead: string; accent: string } {
  const match = tagline.match(/^(.+?[.!?])\s*(.+)$/);
  if (!match) return { lead: tagline, accent: "" };
  return { lead: match[1], accent: match[2] };
}
