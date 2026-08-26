import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedJob } from "../../ingest/types.ts";
import {
  compareJobsByRecency,
  sortJobsWithSponsors,
} from "./job-sort.ts";

function job(
  overrides: Partial<NormalizedJob> & Pick<NormalizedJob, "id" | "title" | "postedAt">,
): NormalizedJob {
  return {
    sourceId: "1",
    hash: "hash",
    company: "Acme",
    companySlug: "acme",
    department: null,
    location: "Remote",
    state: null,
    remote: true,
    applyUrl: "https://example.com",
    description: null,
    salary: null,
    niche: "cpg",
    source: "workday",
    ...overrides,
  };
}

describe("compareJobsByRecency", () => {
  const now = Date.parse("2026-08-26T00:00:00.000Z");

  it("orders newer relative postings first", () => {
    const newer = job({ id: "a", title: "Packaging Manager", postedAt: "Posted 2 Days Ago" });
    const older = job({ id: "b", title: "Packaging Engineer", postedAt: "Posted 17 Days Ago" });
    assert.ok(compareJobsByRecency(newer, older, now) < 0);
    assert.ok(compareJobsByRecency(older, newer, now) > 0);
  });

  it("treats yesterday as newer than multi-day relative dates", () => {
    const yesterday = job({ id: "a", title: "X", postedAt: "Posted Yesterday" });
    const weekOld = job({ id: "b", title: "Y", postedAt: "Posted 7 Days Ago" });
    assert.ok(compareJobsByRecency(yesterday, weekOld, now) < 0);
  });
});

describe("sortJobsWithSponsors", () => {
  const now = Date.parse("2026-08-26T00:00:00.000Z");

  it("keeps pinned jobs first, then sorts by most recent", () => {
    const pinnedOld = job({
      id: "pinned",
      title: "Pinned old role",
      postedAt: "Posted 30 Days Ago",
    });
    const recent = job({
      id: "recent",
      title: "Sales Manager Packaging",
      postedAt: "Posted Yesterday",
    });
    const mid = job({
      id: "mid",
      title: "Packaging Engineer",
      postedAt: "Posted 5 Days Ago",
    });
    const oldest = job({
      id: "old",
      title: "Package Development Scientist",
      postedAt: "Posted 20 Days Ago",
    });

    const sorted = sortJobsWithSponsors(
      [oldest, mid, pinnedOld, recent],
      new Set(["pinned"]),
      now,
    );

    assert.deepEqual(
      sorted.map((item) => item.id),
      ["pinned", "recent", "mid", "old"],
    );
  });

  it("does not prefer core packaging titles over newer postings by default", () => {
    const engineerOld = job({
      id: "eng",
      title: "Packaging Engineer",
      postedAt: "Posted 14 Days Ago",
    });
    const managerNew = job({
      id: "mgr",
      title: "Packaging Manager",
      postedAt: "Posted 1 Days Ago",
    });

    const sorted = sortJobsWithSponsors(
      [engineerOld, managerNew],
      new Set(),
      now,
      "date",
    );

    assert.equal(sorted[0].id, "mgr");
    assert.equal(sorted[1].id, "eng");
  });

  it("can sort by promise rank with pinned still first", () => {
    const pinnedOld = job({
      id: "pinned",
      title: "Pinned sales role",
      postedAt: "Posted 30 Days Ago",
    });
    const engineerOld = job({
      id: "eng",
      title: "Packaging Engineer",
      postedAt: "Posted 14 Days Ago",
    });
    const managerNew = job({
      id: "mgr",
      title: "Packaging Manager",
      postedAt: "Posted 1 Days Ago",
    });
    const salesNew = job({
      id: "sales",
      title: "Account Manager - Healthcare Packaging",
      postedAt: "Posted Yesterday",
    });

    const sorted = sortJobsWithSponsors(
      [salesNew, managerNew, pinnedOld, engineerOld],
      new Set(["pinned"]),
      now,
      "promise",
    );

    assert.deepEqual(
      sorted.map((item) => item.id),
      ["pinned", "eng", "mgr", "sales"],
    );
  });
});
