import type { NormalizedJob } from "./types.ts";

export type ClassifierVerdict = { keep: boolean; reason: string };

export type EmployerIngestStats = {
  scanned: number;
  classifierPass: number;
  classifierDrops: Record<string, number>;
};

export type VerticalIngestStats = EmployerIngestStats & {
  kept: number;
};

export type IngestResult = {
  jobs: NormalizedJob[];
  stats: EmployerIngestStats;
};

/** Per-employer counters for raw ATS scans and classifier outcomes. */
export class IngestStats {
  private scannedIds = new Set<string>();
  private verdicts = new Map<string, ClassifierVerdict>();

  recordScan(sourceId: string) {
    this.scannedIds.add(sourceId.trim() || "(unknown)");
  }

  /** Last verdict wins for the same sourceId (Workday preview + detail pass). */
  recordClassifierResult(sourceId: string, verdict: ClassifierVerdict) {
    this.verdicts.set(sourceId.trim() || "(unknown)", verdict);
  }

  summary(): EmployerIngestStats {
    const classifierDrops: Record<string, number> = {};
    let classifierPass = 0;
    for (const verdict of this.verdicts.values()) {
      if (verdict.keep) classifierPass += 1;
      else {
        classifierDrops[verdict.reason] =
          (classifierDrops[verdict.reason] ?? 0) + 1;
      }
    }
    return {
      scanned: this.scannedIds.size,
      classifierPass,
      classifierDrops,
    };
  }
}

export function mergeClassifierDrops(
  maps: Array<Record<string, number>>,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const map of maps) {
    for (const [reason, count] of Object.entries(map)) {
      merged[reason] = (merged[reason] ?? 0) + count;
    }
  }
  return merged;
}

export function rollupEmployerStats(
  summaries: EmployerIngestStats[],
  kept: number,
): VerticalIngestStats {
  return {
    scanned: summaries.reduce((sum, item) => sum + item.scanned, 0),
    classifierPass: summaries.reduce(
      (sum, item) => sum + item.classifierPass,
      0,
    ),
    kept,
    classifierDrops: mergeClassifierDrops(
      summaries.map((item) => item.classifierDrops),
    ),
  };
}
