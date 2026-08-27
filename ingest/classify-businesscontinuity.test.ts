import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyBusinessContinuityJob } from "./classify-businesscontinuity.ts";

describe("classifyBusinessContinuityJob", () => {
  it("keeps BCM and disaster recovery titles", () => {
    for (const title of [
      "Business Continuity Manager",
      "Director, Disaster Recovery",
      "Resilience Architect",
      "BCM Analyst",
      "IT Continuity Lead",
      "Operational Resilience Manager",
      "Continuity of Business VP",
      "DR Architect",
      "Enterprise Resilience Lead",
      "Global Business Resilience Advisor",
      "BC/DR Specialist",
    ]) {
      const result = classifyBusinessContinuityJob({ title, description: "" });
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
      const result = classifyBusinessContinuityJob({ title, description: "" });
      assert.equal(result.keep, false, title);
    }
  });

  it("drops product/SRE resilience noise", () => {
    for (const title of [
      "Site Reliability Engineer",
      "Senior SRE",
      "Product Resilience Manager",
      "Chaos Engineering Lead",
      "Brand Resilience Specialist",
    ]) {
      const result = classifyBusinessContinuityJob({ title, description: "" });
      assert.equal(result.keep, false, title);
    }
  });

  it("drops software application packaging", () => {
    const result = classifyBusinessContinuityJob({
      title: "Application Packaging Engineer",
      description: "SCCM and Intune",
    });
    assert.equal(result.keep, false);
  });

  it("does not keep description-only resilience with unrelated title", () => {
    const result = classifyBusinessContinuityJob({
      title: "Program Manager",
      description: "Supports operational resilience and business continuity planning.",
    });
    assert.equal(result.keep, false);
  });
});
