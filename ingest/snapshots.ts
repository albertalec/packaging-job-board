import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { VerticalIngestStats } from "./stats.ts";

export type IngestSnapshot = {
  ingestedAt: string;
  scanned: number;
  classifierPass: number;
  listed: number;
  employersWired: number;
  employersWithRoles: number;
  classifierDrops: Record<string, number>;
  jobIds: string[];
  newJobIds?: string[];
  removedJobIds?: string[];
};

export type SnapshotHistory = {
  latest: string;
  snapshots: IngestSnapshot[];
};

const MAX_SNAPSHOTS = 52;

function snapshotPath(verticalId: string): string {
  return path.join(process.cwd(), "data", verticalId, "snapshots.json");
}

export async function appendSnapshot(
  verticalId: string,
  ingestedAt: string,
  stats: VerticalIngestStats,
  jobIds: string[],
  employersWired: number,
  employersWithRoles: number,
): Promise<IngestSnapshot | null> {
  try {
    let history: SnapshotHistory = { latest: "", snapshots: [] };
    try {
      const raw = await readFile(snapshotPath(verticalId), "utf8");
      history = JSON.parse(raw) as SnapshotHistory;
    } catch {
      // first snapshot for this vertical
    }

    const previousIds = new Set(history.snapshots[0]?.jobIds ?? []);
    const currentIds = new Set(jobIds);
    const newJobIds = jobIds.filter((id) => !previousIds.has(id));
    const removedJobIds = [...previousIds].filter((id) => !currentIds.has(id));

    const snapshot: IngestSnapshot = {
      ingestedAt,
      scanned: stats.scanned,
      classifierPass: stats.classifierPass,
      listed: stats.kept,
      employersWired,
      employersWithRoles,
      classifierDrops: stats.classifierDrops,
      jobIds,
      newJobIds,
      removedJobIds,
    };

    history.snapshots.unshift(snapshot);
    if (history.snapshots.length > MAX_SNAPSHOTS) {
      history.snapshots.length = MAX_SNAPSHOTS;
    }
    history.latest = ingestedAt;

    const filePath = snapshotPath(verticalId);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(history, null, 2));
    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Snapshot write failed for ${verticalId}: ${message}`);
    return null;
  }
}

export async function getWeeklyDelta(verticalId: string): Promise<{
  added: number;
  removed: number;
  listed: number;
  ingestedAt: string | null;
}> {
  try {
    const raw = await readFile(snapshotPath(verticalId), "utf8");
    const history = JSON.parse(raw) as SnapshotHistory;
    const latest = history.snapshots[0];
    if (!latest) {
      return { added: 0, removed: 0, listed: 0, ingestedAt: null };
    }
    return {
      added: latest.newJobIds?.length ?? 0,
      removed: latest.removedJobIds?.length ?? 0,
      listed: latest.listed,
      ingestedAt: latest.ingestedAt,
    };
  } catch {
    return { added: 0, removed: 0, listed: 0, ingestedAt: null };
  }
}
