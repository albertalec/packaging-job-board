import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedJob } from "../../ingest/types";
import { jobsDataPath, loadJobs, relatedJobs } from "./jobs";

function stubJob(
  overrides: Partial<NormalizedJob> & Pick<NormalizedJob, "id" | "company" | "title">,
): NormalizedJob {
  return {
    sourceId: overrides.id,
    hash: overrides.id,
    companySlug: overrides.company.toLowerCase().replace(/\s+/g, "-"),
    department: null,
    location: "Minneapolis, MN",
    state: "MN",
    remote: false,
    postedAt: "2026-08-01",
    applyUrl: "https://example.com/jobs",
    description: "",
    salary: null,
    niche: null,
    source: "workday",
    ...overrides,
  };
}

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

describe("relatedJobs", () => {
  const current = stubJob({
    id: "current",
    company: "General Mills",
    title: "Packaging Engineer",
    niche: "food-beverage",
  });

  it("prefers the same company, then the same niche, and excludes the current listing", () => {
    const sameCompany = stubJob({
      id: "same-co",
      company: "General Mills",
      title: "Senior Packaging Engineer",
      niche: "cpg",
    });
    const sameNiche = stubJob({
      id: "same-niche",
      company: "Tyson Foods",
      title: "Packaging Scientist",
      niche: "food-beverage",
    });
    const other = stubJob({
      id: "other",
      company: "PepsiCo",
      title: "Packaging Engineer",
      niche: "cpg",
    });

    const related = relatedJobs(
      [other, current, sameNiche, sameCompany],
      current,
    );

    assert.deepEqual(
      related.map((job) => job.id),
      ["same-co", "same-niche", "other"],
    );
  });

  it("caps the list at three", () => {
    const extras = ["a", "b", "c", "d"].map((id) =>
      stubJob({
        id,
        company: "PepsiCo",
        title: "Packaging Engineer",
        niche: "cpg",
      }),
    );
    assert.equal(relatedJobs([current, ...extras], current).length, 3);
  });
});
