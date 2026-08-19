import type { Niche } from "../../ingest/types";

export const NICHE_LABELS: Record<Niche, string> = {
  cpg: "CPG",
  "food-beverage": "Food / beverage",
  automotive: "Automotive",
  pharma: "Pharma",
  industrial: "Industrial",
};

export function formatNiche(niche: string | null | undefined): string | null {
  if (!niche) return null;
  return NICHE_LABELS[niche as Niche] ?? niche.replaceAll("-", " / ");
}
