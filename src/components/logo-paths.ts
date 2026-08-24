/** Brand Guide v1 — geometric mark paths (48×48 artboard). */
export const BRAND = {
  navy: "#0D1B2A",
  teal: "#0D7D77",
} as const;

/** Navy frame: top, left, and partial bottom — open at bottom-right. */
export const LOGO_FRAME_PATH =
  "M10 10H38M10 10V38M10 38H27";

/** Teal selected corner — rounded triangle, right angle at bottom-right. */
export const LOGO_CORNER_PATH =
  "M27.25 38H37.75Q38 38 38 37.75V27.25Q38 38 27.25 38Z";

export const LOGO_VIEWBOX = "0 0 48 48";
export const LOGO_STROKE_WIDTH = 3.5;
