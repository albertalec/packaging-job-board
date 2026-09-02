import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyBusinessContinuityJob, shouldPrefetchWorkdayDetail } from "./classify-businesscontinuity.ts";

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
      "Operational Resiliency Lead",
      "Business Resilience Manager",
      "Senior Associate, Business Continuity Management",
      "Resiliency Client Engagement, Vice President",
      "Business Continuity Planning Specialist",
      "Senior Manager, Business & Technology Resilience",
      "Senior Manager, Business Resilience and Crisis Management",
      "Sr. Business and Cyber Resilience Analyst",
      "Senior Manager Cybersecurity Incident Response and Business Continuity",
      "Disaster Recovery Specialist",
      "Business Continuity Analyst I - ERM",
      "Enterprise Resilience Analyst",
    ]) {
      const result = classifyBusinessContinuityJob({ title, description: "" });
      assert.equal(result.keep, true, title);
    }
  });

  it("prefetches Workday detail for bank risk/control titles without BCM in list card", () => {
    assert.equal(shouldPrefetchWorkdayDetail("Business Control Manager"), true);
    assert.equal(shouldPrefetchWorkdayDetail("Enterprise Resilience Officer I"), true);
    assert.equal(shouldPrefetchWorkdayDetail("Cons Prod Strat Analyst III"), false);
  });

  it("drops behavioral health crisis account roles without BCM in title", () => {
    const result = classifyBusinessContinuityJob({
      title:
        "Director I Carelon Account Management - Behavioral Health - Louisiana Crisis",
      description:
        "Supports the statewide Crisis Hub for behavioral health crisis services and 988 triage.",
    });
    assert.equal(result.keep, false);
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
      "Staff Software Engineer, Resiliency (Federal)",
      "Product Simplification & Resilience Lead, Global Core Payments - SVP",
      "Senior Software Engineer, AI Resiliency",
      "Lead Data Engineer (Cloud Operations Resilience Engineering)",
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

  it("drops commodities COO and underwriter crisis titles", () => {
    for (const title of [
      "Vice President, Commodities COO",
      "Underwriter, Crisis Management",
    ]) {
      const result = classifyBusinessContinuityJob({ title, description: "" });
      assert.equal(result.keep, false, title);
    }
  });

  it("drops BCP business-cards acronym collision", () => {
    const result = classifyBusinessContinuityJob({
      title: "BCP Customer Engagement Analytics Lead - Business Director",
      description: "Business Cards and Payments analytics for card products.",
    });
    assert.equal(result.keep, false);
  });

  it("drops FEMA-style and humanitarian disaster response roles", () => {
    for (const [title, description] of [
      [
        "Starlink Crisis Response Lead",
        "Experience with FEMA, state emergency management offices, and humanitarian relief.",
      ],
      [
        "Emergency Management Program Manager",
        "Serve as liaison for Public Safety Answering Points and the Emergency Response Team.",
      ],
      [
        "Region Crisis Management Coordinator (Contract)",
        "Support the Family Care program and Prepared @ Airbus crisis exercises.",
      ],
    ] as const) {
      const result = classifyBusinessContinuityJob({ title, description });
      assert.equal(result.keep, false, title);
    }
  });

  it("keeps corporate BCM when emergency management is paired in title", () => {
    for (const title of [
      "Emergency Management & Business Continuity Program Manager",
      "Business Continuity / Senior Business Continuity and Emergency Management Specialist",
      "Manager, Crisis Management & Business Continuity",
    ]) {
      const result = classifyBusinessContinuityJob({
        title,
        description: "Own the BCM program and disaster recovery planning.",
      });
      assert.equal(result.keep, true, title);
    }
  });

  it("drops product engineering and manufacturing resiliency noise", () => {
    for (const [title, description, department] of [
      [
        "Member of Technical Staff (Disaster Recovery)",
        "Backend software engineer on backup and replication features.",
        "Engineering",
      ],
      [
        "Director, Operations Resiliency, Capacity Growth Office",
        "Lead smart factory and IIoT resiliency for new factory builds.",
        null,
      ],
    ] as const) {
      const result = classifyBusinessContinuityJob({
        title,
        description,
        department,
      });
      assert.equal(result.keep, false, title);
    }
  });
});
