/** Brand Guide v1.0 — geometric mark paths (235×235 artboard, 4-unit grid). */
export const BRAND = {
  navy: "#0D1B2A",
  teal: "#0D7D77",
  amber: "#F5A623",
  violet: "#6A5FA9",
  clay: "#A85C57",
} as const;

/** Navy crop mark — top-left corner (structure, the board itself). */
export const LOGO_NAVY_PATH = "M0 0H235V62H62V235H0Z";

/** Teal crop mark — bottom-right corner (the specialist, closing the match). */
export const LOGO_TEAL_PATH = "M235 235H120V180H180V120H235Z";

export const LOGO_VIEWBOX = "0 0 235 235";

/** Roundel avatar artboard (symbol at ~56% of disc). */
export const LOGO_ROUNDEL_VIEWBOX = "0 0 800 800";
export const LOGO_ROUNDEL_NAVY_PATH = "M175 175H625V295H295V625H175Z";
export const LOGO_ROUNDEL_TEAL_PATH = "M625 625H400V505H505V400H625Z";

/** Split tagline for Newsreader italic lockup variants. */
export function splitTagline(tagline: string): { lead: string; accent: string } {
  const match = tagline.match(/^(.+?[,.!?])\s*(.+)$/);
  if (!match) return { lead: tagline, accent: "" };
  return { lead: match[1], accent: match[2] };
}

/** Uppercase kicker with final word accented — e.g. "specialists." in teal. */
export function splitKicker(kicker: string): { lead: string; accent: string } {
  const match = kicker.match(/^(.+\s)([\w.]+)$/);
  if (!match) return { lead: kicker, accent: "" };
  return { lead: match[1], accent: match[2] };
}
