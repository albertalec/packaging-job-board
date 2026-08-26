import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedJob } from "../../ingest/types";
import {
  findTokenIndex,
  highlightSnippet,
  parseSearchQuery,
  searchJobs,
} from "./job-search.ts";

function stubJob(
  overrides: Partial<NormalizedJob> & Pick<NormalizedJob, "id" | "title">,
): NormalizedJob {
  return {
    sourceId: overrides.id,
    hash: overrides.id,
    company: "General Mills",
    companySlug: "general-mills",
    department: null,
    location: "Minneapolis, MN",
    state: "MN",
    remote: false,
    postedAt: "2026-08-01",
    applyUrl: "https://example.com/jobs",
    description: "",
    salary: null,
    niche: "food-beverage",
    source: "workday",
    ...overrides,
  };
}

describe("parseSearchQuery", () => {
  it("splits on whitespace and keeps quoted phrases", () => {
    assert.deepEqual(parseSearchQuery('CAD "flexible packaging" ISTA'), [
      "CAD",
      "flexible packaging",
      "ISTA",
    ]);
  });

  it("drops one-character tokens", () => {
    assert.deepEqual(parseSearchQuery("R D CAD"), ["CAD"]);
  });
});

describe("findTokenIndex", () => {
  it("matches whole words, not substrings", () => {
    assert.equal(findTokenIndex("Must compete for resources", "pet"), -1);
    assert.equal(findTokenIndex("PET bottles and film", "pet"), 0);
  });

  it("matches camelCase suffixes like ArtiosCAD", () => {
    assert.ok(findTokenIndex("Experience with ArtiosCAD and CAPE", "cad") >= 0);
    assert.equal(findTokenIndex("the carpet samples", "pet"), -1);
  });
});

describe("searchJobs", () => {
  const titleHit = stubJob({
    id: "title",
    title: "Staff Packaging Engineer",
    description: "Lead package development for cereal.",
  });
  const bodyHit = stubJob({
    id: "body",
    title: "Package Development Manager",
    description:
      "Use ArtiosCAD to design corrugated retail-ready packaging. ISTA 3A testing required.",
  });
  const other = stubJob({
    id: "other",
    title: "Packaging Engineer",
    description: "Must compete for lab time. Benefits include pet insurance.",
  });

  it("finds posting-body keywords that are missing from the title", () => {
    const hits = searchJobs([titleHit, bodyHit, other], "ArtiosCAD");
    assert.deepEqual(
      hits.map((hit) => hit.job.id),
      ["body"],
    );
    assert.match(hits[0]?.snippet ?? "", /ArtiosCAD/);
  });

  it("requires every token (AND) and ranks title matches first", () => {
    const hits = searchJobs([bodyHit, titleHit, other], "packaging engineer");
    assert.deepEqual(
      hits.map((hit) => hit.job.id),
      ["title", "other"],
    );
    assert.equal(hits[0]?.snippet, null);
  });

  it("matches quoted phrases as a unit", () => {
    const hits = searchJobs([titleHit, bodyHit], '"retail-ready packaging"');
    assert.deepEqual(
      hits.map((hit) => hit.job.id),
      ["body"],
    );
  });

  it("does not treat PET as a substring of compete", () => {
    const hits = searchJobs([other], "PET");
    assert.equal(hits.length, 0);
  });

  it("keeps all-caps abbreviations from matching lowercase lookalikes", () => {
    const petFood = stubJob({
      id: "pet-food",
      title: "Packaging Engineer",
      description: "Benefits include pet insurance. Work on pet treats.",
    });
    const resin = stubJob({
      id: "resin",
      title: "Packaging Engineer",
      description: "Specify PET and HDPE bottles for the line.",
    });
    assert.deepEqual(
      searchJobs([petFood, resin], "PET").map((hit) => hit.job.id),
      ["resin"],
    );
    assert.deepEqual(
      searchJobs([petFood, resin], "pet").map((hit) => hit.job.id),
      ["pet-food", "resin"],
    );
  });

  it("decodes HTML entities before matching", () => {
    const encoded = stubJob({
      id: "encoded",
      title: "Packaging Scientist",
      description: "Bachelor&#39;s in packaging. SolidWorks preferred.&#xa;ISTA 3A.",
    });
    const hits = searchJobs([encoded], "solidworks");
    assert.equal(hits.length, 1);
    assert.match(hits[0]?.snippet ?? "", /SolidWorks/);
  });
});

describe("highlightSnippet", () => {
  it("marks matched terms in the excerpt", () => {
    const parts = highlightSnippet("Use ArtiosCAD to design corrugated packs", [
      "cad",
      "corrugated",
    ]);
    const marked = parts.filter((part) => part.match).map((part) => part.text);
    assert.deepEqual(marked, ["CAD", "corrugated"]);
  });
});
