import type { Company } from "./types.ts";

/** Unique keyword searches for a company (primary + extras). */
export function companySearchTexts(company: Company): string[] {
  const texts = [
    company.searchText,
    ...(company.searchTexts ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));
  if (texts.length === 0) return ["packaging"];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const text of texts) {
    const key = text.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(text.trim());
  }
  return unique;
}
