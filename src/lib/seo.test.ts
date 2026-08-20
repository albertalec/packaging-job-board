import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildJobPostingJsonLd,
  cityFromLocation,
  normalizePath,
  parseSalary,
  toIsoDate,
} from "./seo.ts";
import type { NormalizedJob } from "../../ingest/types.ts";

const sampleJob: NormalizedJob = {
  id: "general-mills-abc",
  sourceId: "1",
  hash: "hash",
  company: "General Mills",
  companySlug: "general-mills",
  title: "Packaging Engineer",
  department: null,
  location: "Minneapolis, MN",
  state: "MN",
  remote: false,
  postedAt: "Posted 17 Days Ago",
  applyUrl: "https://example.com/apply",
  description: "Design packaging for CPG brands.",
  salary: null,
  niche: "cpg",
  source: "workday",
};

describe("toIsoDate", () => {
  it("parses ISO dates", () => {
    const iso = toIsoDate("2026-08-01T12:00:00.000Z");
    assert.equal(iso, "2026-08-01T12:00:00.000Z");
  });

  it("approximates relative Workday strings", () => {
    const now = Date.parse("2026-08-20T00:00:00.000Z");
    const iso = toIsoDate("Posted 17 Days Ago", now);
    assert.equal(iso, "2026-08-03T00:00:00.000Z");
  });

  it("handles 30+ days ago", () => {
    const now = Date.parse("2026-08-20T00:00:00.000Z");
    const iso = toIsoDate("Posted 30+ Days Ago", now);
    assert.equal(iso, "2026-07-21T00:00:00.000Z");
  });

  it("returns null for empty values", () => {
    assert.equal(toIsoDate(null), null);
    assert.equal(toIsoDate(""), null);
  });
});

describe("parseSalary", () => {
  it("parses yearly ranges", () => {
    const salary = parseSalary("$120,000 - $140,000 per year");
    assert.ok(salary);
    assert.equal(salary.currency, "USD");
    assert.equal(salary.minValue, 120000);
    assert.equal(salary.maxValue, 140000);
    assert.equal(salary.unitText, "YEAR");
  });

  it("parses hourly rates", () => {
    const salary = parseSalary("$45/hr");
    assert.ok(salary);
    assert.equal(salary.minValue, 45);
    assert.equal(salary.unitText, "HOUR");
  });
});

describe("buildJobPostingJsonLd", () => {
  it("emits Google for Jobs fields", () => {
    const jsonLd = buildJobPostingJsonLd(
      sampleJob,
      "https://packaging.nicheboardjobs.com/jobs/general-mills-abc",
    );
    assert.equal(jsonLd["@type"], "JobPosting");
    assert.equal(jsonLd.title, "Packaging Engineer");
    assert.equal(jsonLd.directApply, true);
    assert.equal(jsonLd.url, "https://packaging.nicheboardjobs.com/jobs/general-mills-abc");
    assert.equal(
      (jsonLd.hiringOrganization as { name: string }).name,
      "General Mills",
    );
    assert.equal(
      (
        jsonLd.jobLocation as {
          address: { addressRegion: string; addressLocality: string };
        }
      ).address.addressRegion,
      "MN",
    );
    assert.equal(
      (
        jsonLd.jobLocation as {
          address: { addressLocality: string };
        }
      ).address.addressLocality,
      "Minneapolis",
    );
    assert.ok(typeof jsonLd.datePosted === "string");
  });

  it("marks remote roles as TELECOMMUTE", () => {
    const jsonLd = buildJobPostingJsonLd(
      { ...sampleJob, remote: true, location: "Remote, USA" },
      "https://packaging.nicheboardjobs.com/jobs/general-mills-abc",
    );
    assert.equal(jsonLd.jobLocationType, "TELECOMMUTE");
  });
});

describe("helpers", () => {
  it("normalizes paths", () => {
    assert.equal(normalizePath("/"), "/");
    assert.equal(normalizePath("/jobs/abc/"), "/jobs/abc");
    assert.equal(normalizePath("jobs/abc"), "/jobs/abc");
  });

  it("reads city from location", () => {
    assert.equal(cityFromLocation("Minneapolis, MN"), "Minneapolis");
    assert.equal(cityFromLocation("Remote"), null);
  });
});
