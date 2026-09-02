import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { classifyJob, toJob } from "./classify.ts";
import { appendSnapshot, getWeeklyDelta } from "./snapshots.ts";
import {
  IngestStats,
  mergeClassifierDrops,
  rollupEmployerStats,
} from "./stats.ts";
import type { Company } from "./types.ts";

describe("IngestStats", () => {
  it("dedupes scans by sourceId", () => {
    const stats = new IngestStats();
    stats.recordScan("abc");
    stats.recordScan("abc");
    stats.recordScan("def");
    assert.equal(stats.summary().scanned, 2);
  });

  it("uses last classifier verdict per sourceId", () => {
    const stats = new IngestStats();
    stats.recordScan("1");
    stats.recordClassifierResult("1", {
      keep: false,
      reason: "warehouse/ops title",
    });
    stats.recordClassifierResult("1", {
      keep: true,
      reason: "packaging role match",
    });
    const summary = stats.summary();
    assert.equal(summary.classifierPass, 1);
    assert.equal(summary.classifierDrops["warehouse/ops title"], undefined);
  });

  it("rolls up employer summaries", () => {
    const rollup = rollupEmployerStats(
      [
        {
          scanned: 10,
          classifierPass: 2,
          classifierDrops: { "not a packaging role": 8 },
        },
        {
          scanned: 5,
          classifierPass: 1,
          classifierDrops: { "warehouse/ops title": 4 },
        },
      ],
      3,
    );
    assert.equal(rollup.scanned, 15);
    assert.equal(rollup.classifierPass, 3);
    assert.equal(rollup.kept, 3);
    assert.equal(rollup.classifierDrops["not a packaging role"], 8);
    assert.equal(rollup.classifierDrops["warehouse/ops title"], 4);
  });

  it("merges classifier drop maps", () => {
    const merged = mergeClassifierDrops([
      { "off-target function": 2 },
      { "off-target function": 1, "warehouse/ops title": 4 },
    ]);
    assert.deepEqual(merged, {
      "off-target function": 3,
      "warehouse/ops title": 4,
    });
  });
});

describe("toJob stats recording", () => {
  const company: Company = {
    name: "Test Co",
    slug: "test-co",
    ats: "greenhouse",
    careerUrl: "https://example.com",
    boardToken: "test",
  };

  it("records scanned but not classifierPass for rejected titles", () => {
    const stats = new IngestStats();
    stats.recordScan("123");
    const job = toJob(
      company,
      {
        sourceId: "123",
        title: "Package Handler",
        location: "Chicago, IL",
        applyUrl: "https://example.com/j/123",
        description: "Move packages",
      },
      stats,
    );
    assert.equal(job, null);
    const summary = stats.summary();
    assert.equal(summary.scanned, 1);
    assert.equal(summary.classifierPass, 0);
    assert.equal(summary.classifierDrops["warehouse/ops title"], 1);
  });

  it("records classifierPass for kept titles", () => {
    const stats = new IngestStats();
    stats.recordScan("456");
    const job = toJob(
      company,
      {
        sourceId: "456",
        title: "Packaging Engineer II",
        location: "Cincinnati, OH",
        applyUrl: "https://example.com/j/456",
        description: "Design packaging systems",
      },
      stats,
    );
    assert.ok(job);
    const summary = stats.summary();
    assert.equal(summary.scanned, 1);
    assert.equal(summary.classifierPass, 1);
    assert.deepEqual(summary.classifierDrops, {});
  });
});

describe("snapshots", () => {
  it("appends snapshot history and computes diffs", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ingest-snap-"));
    const previousCwd = process.cwd();
    process.chdir(root);
    try {
      await mkdir(path.join(root, "data", "packaging"), { recursive: true });
      await writeFile(
        path.join(root, "data", "packaging", "snapshots.json"),
        JSON.stringify(
          {
            latest: "2026-01-01T00:00:00.000Z",
            snapshots: [
              {
                ingestedAt: "2026-01-01T00:00:00.000Z",
                scanned: 10,
                classifierPass: 2,
                listed: 2,
                employersWired: 1,
                employersWithRoles: 1,
                classifierDrops: {},
                jobIds: ["a", "b"],
              },
            ],
          },
          null,
          2,
        ),
      );

      const snapshot = await appendSnapshot(
        "packaging",
        "2026-01-08T00:00:00.000Z",
        {
          scanned: 12,
          classifierPass: 3,
          kept: 3,
          classifierDrops: { "not a packaging role": 9 },
        },
        ["a", "b", "c"],
        1,
        1,
      );
      assert.ok(snapshot);
      assert.deepEqual(snapshot?.newJobIds, ["c"]);
      assert.deepEqual(snapshot?.removedJobIds, []);

      const delta = await getWeeklyDelta("packaging");
      assert.equal(delta.added, 1);
      assert.equal(delta.listed, 3);

      const raw = await readFile(
        path.join(root, "data", "packaging", "snapshots.json"),
        "utf8",
      );
      const history = JSON.parse(raw) as { snapshots: Array<{ jobIds: string[] }> };
      assert.equal(history.snapshots.length, 2);
      assert.deepEqual(history.snapshots[0].jobIds, ["a", "b", "c"]);
    } finally {
      process.chdir(previousCwd);
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("classifyJob reason keys", () => {
  it("returns stable reason for fixture drop title", () => {
    const verdict = classifyJob({
      title: "Package Handler",
      description: "Move packages",
      department: null,
    });
    assert.equal(verdict.keep, false);
    assert.equal(verdict.reason, "warehouse/ops title");
  });
});
