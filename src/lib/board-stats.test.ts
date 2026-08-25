import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  boardEctRating,
  countSectors,
  employerLede,
} from "./board-stats.ts";
import type { NormalizedJob } from "../../ingest/types.ts";

const job = (company: string, niche: string): NormalizedJob => ({
  id: `${company}-1`,
  sourceId: "1",
  hash: "h",
  company,
  companySlug: company.toLowerCase(),
  title: "Packaging Engineer",
  department: null,
  location: "Minneapolis, MN",
  state: "MN",
  remote: false,
  postedAt: "Posted 2 Days Ago",
  applyUrl: "https://example.com",
  description: "",
  salary: null,
  niche: niche as NormalizedJob["niche"],
  source: "workday",
});

describe("boardEctRating", () => {
  it("returns 32 for empty boards", () => {
    assert.equal(boardEctRating(0), 32);
  });

  it("scales near 44 for ~51 roles", () => {
    assert.equal(boardEctRating(51), 44);
  });
});

describe("countSectors", () => {
  it("counts unique niches", () => {
    const jobs = [job("A", "cpg"), job("B", "pharma"), job("C", "cpg")];
    assert.equal(countSectors(jobs), 2);
  });
});

describe("employerLede", () => {
  it("names top employers and others count", () => {
    const jobs = [
      job("General Mills", "cpg"),
      job("Johnson & Johnson", "pharma"),
      job("Mars", "food-beverage"),
      job("Clorox", "cpg"),
      job("PepsiCo", "food-beverage"),
    ];
    for (let i = 0; i < 17; i += 1) {
      jobs.push(job(`Employer ${i}`, "industrial"));
    }
    const text = employerLede(jobs);
    assert.match(text, /General Mills/);
    assert.match(text, /18 others/);
  });
});
