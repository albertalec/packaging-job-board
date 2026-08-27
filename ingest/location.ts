import { htmlToPlainText } from "../src/lib/description.ts";
import { parseState, US_STATES } from "../src/lib/states.ts";

const STATE_NAME_TO_CODE = new Map(
  US_STATES.map((state) => [state.name.toLowerCase(), state.code]),
);

/**
 * Intermountain (and some other Workday tenants) put city/state in the
 * description as "Work City:" / "Work State:" while the listing location is
 * only a campus name + country. Pull those so cards and alert digests can
 * tell multi-campus postings apart and state filters work.
 */
export function cityStateFromDescription(
  description: string,
): { city: string; stateCode: string | null; stateLabel: string } | null {
  const plain = htmlToPlainText(description).replace(/\r/g, "\n");
  const city = plain.match(/Work\s*City:\s*\n?\s*([^\n|]+)/i)?.[1]?.trim();
  const stateLabel = plain
    .match(/Work\s*State:\s*\n?\s*([^\n|]+)/i)?.[1]
    ?.trim();
  if (!city && !stateLabel) return null;
  // Guard against leftover label bleed (e.g. "Murray Work State").
  const cleanCity = (city ?? "").replace(/\s+Work\s*State:?$/i, "").trim();
  const cleanState = (stateLabel ?? "")
    .replace(/\s+Scheduled\b.*$/i, "")
    .trim();
  if (!cleanCity && !cleanState) return null;
  const stateCode = cleanState
    ? STATE_NAME_TO_CODE.get(cleanState.toLowerCase()) ??
      (/^[A-Z]{2}$/i.test(cleanState) ? cleanState.toUpperCase() : null)
    : null;
  return {
    city: cleanCity,
    stateCode,
    stateLabel: cleanState,
  };
}

/** Merge Work City / Work State into a sparse ATS location string. */
export function enrichLocationWithCityState(
  location: string,
  description: string,
): string {
  const found = cityStateFromDescription(description);
  if (!found?.city) return location;

  const cityState = found.stateCode
    ? `${found.city}, ${found.stateCode}`
    : found.stateLabel
      ? `${found.city}, ${found.stateLabel}`
      : found.city;

  const trimmed = location.trim();
  if (!trimmed || /^location not listed$/i.test(trimmed)) return cityState;

  // Already ends with this city/state pair.
  if (new RegExp(`${escapeRegExp(cityState)}\\s*$`, "i").test(trimmed)) {
    return trimmed.replace(/,?\s*United States of America\s*$/i, "").trim();
  }

  const withoutCountry = trimmed
    .replace(/,?\s*United States of America\s*$/i, "")
    .replace(/,?\s*United States\s*$/i, "")
    .replace(/,?\s*\bUSA\b\s*$/i, "")
    .trim();

  // Campus names sometimes include the city (e.g. Riverton Hospital). Prefer
  // "City, ST · campus" so state parsers and alert filters see a clear city.
  if (parseState(withoutCountry) && /,\s*[A-Z]{2}\b/.test(withoutCountry)) {
    return withoutCountry;
  }

  return `${cityState} · ${withoutCountry}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
