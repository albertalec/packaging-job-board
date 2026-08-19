import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { promiseRank } from "./rank.ts";

describe("promiseRank", () => {
  it("ranks packaging engineers above plant and buying titles", () => {
    assert.equal(promiseRank("Packaging Engineer"), 3);
    assert.equal(promiseRank("Package Development Scientist"), 3);
    assert.equal(
      promiseRank("Internship - Research & Development Packaging Engineer"),
      2,
    );
    assert.equal(promiseRank("Packaging Manager"), 1);
  });

  it("buries off-target titles if they slip past ingest", () => {
    assert.equal(promiseRank("KCNA Procurement Sr. Specialist, Packaging"), 0);
    assert.equal(promiseRank("Account Manager - Healthcare Packaging"), 0);
    assert.equal(promiseRank("3rd Shift Corrugator Supervisor"), 0);
    assert.equal(promiseRank("Principal Engineer - Packaging Equipment"), 0);
    assert.equal(promiseRank("Senior Packaging Delivery Leader"), 0);
    assert.equal(
      promiseRank("Sr. Principal Process Engineer –Packaging"),
      0,
    );
  });
});
