import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyDrJob } from "./classify-disasterrecovery.ts";

describe("classifyDrJob", () => {
  it("keeps BCM and disaster recovery titles", () => {
    for (const title of [
      "Business Continuity Manager",
      "Director, Disaster Recovery",
      "Resilience Architect",
      "BCM Analyst",
      "IT Continuity Lead",
    ]) {
      const result = classifyDrJob({ title, description: "" });
      assert.equal(result.keep, true, title);
    }
  });

  it("drops generic IT without continuity signal", () => {
    for (const title of [
      "Desktop Support Specialist",
      "Network Engineer",
      "Software Engineer II",
      "Help Desk Analyst",
    ]) {
      const result = classifyDrJob({ title, description: "" });
      assert.equal(result.keep, false, title);
    }
  });

  it("drops software application packaging", () => {
    const result = classifyDrJob({
      title: "Application Packaging Engineer",
      description: "SCCM and Intune",
    });
    assert.equal(result.keep, false);
  });
});
