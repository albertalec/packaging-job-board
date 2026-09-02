import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { workdayFetch } from "./workday-http.ts";

describe("workdayFetch", () => {
  it("falls back to curl when Node fetch returns HTTP 500", async () => {
    const url =
      "https://truist.wd1.myworkdayjobs.com/wday/cxs/truist/Careers/jobs";
    const body = JSON.stringify({
      appliedFacets: {},
      limit: 3,
      offset: 0,
      searchText: "enterprise resilience",
    });
    const res = await workdayFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://truist.wd1.myworkdayjobs.com/Careers",
        "User-Agent": "Mozilla/5.0",
      },
      body,
    });
    assert.equal(res.ok, true);
    const page = JSON.parse(res.text) as { total?: number; jobPostings?: unknown[] };
    assert.ok((page.total ?? 0) > 0);
    assert.ok((page.jobPostings?.length ?? 0) > 0);
  });
});
