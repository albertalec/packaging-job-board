import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jobsDataPath, loadJobs } from "./jobs";

describe("loadJobs", () => {
  it("resolves the packaging data file under data/<vertical>/jobs.json", () => {
    assert.match(jobsDataPath("packaging"), /data[/\\]packaging[/\\]jobs\.json$/);
  });

  it("loads live packaging listings from disk", () => {
    const { jobs, total, ingestedAt } = loadJobs("packaging");
    assert.ok(ingestedAt, "expected ingestedAt from data/packaging/jobs.json");
    assert.ok(total > 0, "expected packaging jobs on disk");
    assert.equal(jobs.length, total);
  });
});
