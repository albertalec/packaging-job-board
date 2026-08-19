import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedJob } from "../../ingest/types";
import { parsePostedAt, toIsoDate } from "./job-dates";
import { buildJobPostingJsonLd } from "./job-posting-jsonld";

const sampleJob: NormalizedJob = {
  id: "general-mills-test",
  sourceId: "src",
  hash: "abc",
  company: "General Mills",
  companySlug: "general-mills",
  title: "Packaging Engineer II",
  department: null,
  location: "Minneapolis, MN",
  state: "MN",
  remote: false,
  postedAt: "Posted 9 Days Ago",
  applyUrl: "https://example.com/apply",
  description: "Packaging R&D role.\n\nMINIMUM QUALIFICATIONS\n\n• Bachelor's degree",
  salary: null,
  niche: "food-beverage",
  source: "workday",
};

describe("parsePostedAt", () => {
  it("parses relative Workday strings", () => {
    const date = parsePostedAt("Posted 9 Days Ago");
    assert.ok(date);
    const daysAgo = Math.round((Date.now() - date.getTime()) / 86_400_000);
    assert.equal(daysAgo, 9);
  });

  it("parses ISO timestamps", () => {
    const date = parsePostedAt("2026-07-21T14:04:15-04:00");
    assert.ok(date);
    assert.equal(date.getFullYear(), 2026);
  });
});

describe("buildJobPostingJsonLd", () => {
  it("emits JobPosting fields for an on-site role", () => {
    process.env.SITE_URL = "https://packagingjobboard.com";
    const json = buildJobPostingJsonLd(sampleJob);
    assert.equal(json["@type"], "JobPosting");
    assert.equal(json.title, sampleJob.title);
    assert.equal(json.directApply, true);
    assert.match(String(json.url), /\/jobs\/general-mills-test$/);
    assert.equal(toIsoDate(parsePostedAt(sampleJob.postedAt)), json.datePosted);
    const location = json.jobLocation as { address: { addressLocality: string } };
    assert.equal(location.address.addressLocality, "Minneapolis");
  });

  it("marks remote roles as TELECOMMUTE", () => {
    const json = buildJobPostingJsonLd({ ...sampleJob, remote: true });
    assert.equal(json.jobLocationType, "TELECOMMUTE");
    assert.equal(json.jobLocation, undefined);
  });
});
