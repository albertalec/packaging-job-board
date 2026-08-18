export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

const CODE_SET = new Set<string>(US_STATES.map((state) => state.code));
const NAMED_STATES = [...US_STATES].sort((a, b) => b.name.length - a.name.length);

export function parseState(location: string): string | null {
  if (!location) return null;
  const text = location.trim();

  const segments = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (segments.length >= 3) {
    const last = segments[segments.length - 1];
    if (/^[A-Z]{2}$/i.test(last) && last.toUpperCase() !== "US") {
      return null;
    }
  }

  const usa = text.match(/\bUSA?-([A-Z]{2})(?:-|,|\b)/i);
  if (usa && CODE_SET.has(usa[1].toUpperCase())) return usa[1].toUpperCase();

  for (const { code, name } of NAMED_STATES) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const comma = new RegExp(`(?:^|,\\s+)${escaped}(?=\\s*,|\\s*$)`, "i");
    const hyphen = new RegExp(`-\\s*${escaped}(?=\\s*,|\\s*$)`, "i");
    if (comma.test(text) || hyphen.test(text)) return code;
  }

  const abbrev = text.match(/,\s*([A-Z]{2})(?:\s*,|\s*$|\s*\()/i);
  if (abbrev && CODE_SET.has(abbrev[1].toUpperCase())) {
    return abbrev[1].toUpperCase();
  }

  const zip = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zip) return zipToState(zip[1]);

  return null;
}

const ZIP_PREFIX: Array<[number, number, string]> = [
  [350, 369, "AL"],
  [995, 999, "AK"],
  [850, 865, "AZ"],
  [716, 729, "AR"],
  [900, 961, "CA"],
  [800, 816, "CO"],
  [60, 69, "CT"],
  [197, 199, "DE"],
  [200, 205, "DC"],
  [320, 349, "FL"],
  [300, 319, "GA"],
  [398, 399, "GA"],
  [967, 968, "HI"],
  [832, 838, "ID"],
  [600, 629, "IL"],
  [460, 479, "IN"],
  [500, 528, "IA"],
  [660, 679, "KS"],
  [400, 427, "KY"],
  [700, 714, "LA"],
  [39, 49, "ME"],
  [206, 219, "MD"],
  [10, 27, "MA"],
  [480, 499, "MI"],
  [550, 567, "MN"],
  [386, 397, "MS"],
  [630, 658, "MO"],
  [590, 599, "MT"],
  [680, 693, "NE"],
  [889, 898, "NV"],
  [30, 38, "NH"],
  [70, 89, "NJ"],
  [870, 884, "NM"],
  [100, 149, "NY"],
  [270, 289, "NC"],
  [580, 588, "ND"],
  [430, 459, "OH"],
  [730, 749, "OK"],
  [970, 979, "OR"],
  [150, 196, "PA"],
  [28, 29, "RI"],
  [290, 299, "SC"],
  [570, 577, "SD"],
  [370, 385, "TN"],
  [750, 799, "TX"],
  [885, 885, "TX"],
  [840, 847, "UT"],
  [50, 59, "VT"],
  [220, 246, "VA"],
  [980, 994, "WA"],
  [247, 268, "WV"],
  [530, 549, "WI"],
  [820, 831, "WY"],
];

function zipToState(zip: string): string | null {
  const prefix = Number.parseInt(zip.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return null;
  for (const [from, to, code] of ZIP_PREFIX) {
    if (prefix >= from && prefix <= to) return code;
  }
  return null;
}

export function jobState(job: { state?: string | null; location: string }): string | null {
  if (job.state) return job.state;
  return parseState(job.location);
}
