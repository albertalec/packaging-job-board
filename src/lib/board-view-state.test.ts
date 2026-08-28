import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  BOARD_PAGE_SIZE,
  boardViewStorageKey,
  clearBoardViewState,
  normalizeBoardViewState,
  readBoardViewState,
  writeBoardViewState,
} from "./board-view-state.ts";

const TENANT = "packaging";

function mockSessionStorage() {
  const store = new Map<string, string>();
  const sessionStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: sessionStorage,
  });
  return store;
}

describe("normalizeBoardViewState", () => {
  it("returns defaults for invalid payloads", () => {
    assert.equal(normalizeBoardViewState(null), null);
    assert.deepEqual(normalizeBoardViewState({}), {
      query: "",
      niche: "",
      state: "",
      remoteOnly: false,
      sortMode: "date",
      visibleCount: BOARD_PAGE_SIZE,
      scrollY: 0,
    });
  });

  it("clamps visibleCount to at least PAGE_SIZE", () => {
    const normalized = normalizeBoardViewState({
      visibleCount: 3,
      sortMode: "promise",
      query: "continuity",
      scrollY: 1200,
    });
    assert.equal(normalized?.visibleCount, BOARD_PAGE_SIZE);
    assert.equal(normalized?.sortMode, "promise");
    assert.equal(normalized?.query, "continuity");
    assert.equal(normalized?.scrollY, 1200);
  });

  it("rejects unknown sort modes", () => {
    const normalized = normalizeBoardViewState({ sortMode: "alpha" });
    assert.equal(normalized?.sortMode, "date");
  });
});

describe("board view sessionStorage", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  });

  it("round-trips write and read", () => {
    mockSessionStorage();
    const snapshot = {
      query: "disaster recovery",
      niche: "finance",
      state: "MI",
      remoteOnly: true,
      sortMode: "promise" as const,
      visibleCount: 24,
      scrollY: 640,
    };
    writeBoardViewState(TENANT, snapshot);
    assert.deepEqual(readBoardViewState(TENANT), snapshot);
    assert.equal(
      sessionStorage.getItem(boardViewStorageKey(TENANT)),
      JSON.stringify(snapshot),
    );
  });

  it("clearBoardViewState removes the tenant entry", () => {
    mockSessionStorage();
    writeBoardViewState(TENANT, {
      query: "bcm",
      niche: "",
      state: "",
      remoteOnly: false,
      sortMode: "date",
      visibleCount: BOARD_PAGE_SIZE,
      scrollY: 0,
    });
    clearBoardViewState(TENANT);
    assert.equal(readBoardViewState(TENANT), null);
  });
});
