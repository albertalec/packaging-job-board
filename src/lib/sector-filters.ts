import type { Niche } from "../../ingest/types";
import { NICHE_LABELS } from "./niches";

/** Sector chips from tenant sector filter ids. */
export function sectorFilterOptions(sectorFilters: string[]) {
  return [
    { id: "", label: "All sectors" },
    ...sectorFilters.map((id) => ({
      id,
      label: NICHE_LABELS[id as Niche] ?? id.replaceAll("-", " / "),
    })),
  ];
}
