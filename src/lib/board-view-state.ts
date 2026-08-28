import type { BoardSortMode } from "./job-sort";

export const BOARD_PAGE_SIZE = 8;

export type BoardViewState = {
  query: string;
  niche: string;
  state: string;
  remoteOnly: boolean;
  sortMode: BoardSortMode;
  visibleCount: number;
  scrollY: number;
};

export function boardViewStorageKey(tenantId: string): string {
  return `nicheboard-board-view:${tenantId}`;
}

function isSortMode(value: unknown): value is BoardSortMode {
  return value === "date" || value === "promise";
}

export function normalizeBoardViewState(raw: unknown): BoardViewState | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  return {
    query: typeof record.query === "string" ? record.query : "",
    niche: typeof record.niche === "string" ? record.niche : "",
    state: typeof record.state === "string" ? record.state : "",
    remoteOnly: record.remoteOnly === true,
    sortMode: isSortMode(record.sortMode) ? record.sortMode : "date",
    visibleCount: Math.max(
      BOARD_PAGE_SIZE,
      typeof record.visibleCount === "number" && Number.isFinite(record.visibleCount)
        ? Math.floor(record.visibleCount)
        : BOARD_PAGE_SIZE,
    ),
    scrollY:
      typeof record.scrollY === "number" &&
      Number.isFinite(record.scrollY) &&
      record.scrollY >= 0
        ? Math.floor(record.scrollY)
        : 0,
  };
}

function storageAvailable(): boolean {
  return typeof sessionStorage !== "undefined";
}

export function readBoardViewState(tenantId: string): BoardViewState | null {
  if (!storageAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(boardViewStorageKey(tenantId));
    if (!raw) return null;
    return normalizeBoardViewState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeBoardViewState(tenantId: string, state: BoardViewState): void {
  if (!storageAvailable()) return;
  const normalized = normalizeBoardViewState(state);
  if (!normalized) return;
  try {
    sessionStorage.setItem(boardViewStorageKey(tenantId), JSON.stringify(normalized));
  } catch {
    // private mode / quota
  }
}

export function clearBoardViewState(tenantId: string): void {
  if (!storageAvailable()) return;
  try {
    sessionStorage.removeItem(boardViewStorageKey(tenantId));
  } catch {
    // ignore
  }
}
