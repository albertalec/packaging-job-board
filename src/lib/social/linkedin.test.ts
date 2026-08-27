import assert from "node:assert/strict";
import test from "node:test";
import { buildGrokMessages } from "./grok";
import { pickFreshJob } from "./jobs";
import { xSearchQuery } from "./x";

test("xSearchQuery returns vertical-specific queries", () => {
  assert.match(xSearchQuery("packaging"), /packaging engineer/i);
  assert.match(xSearchQuery("packaging"), /-is:retweet/);
  assert.match(xSearchQuery("businesscontinuity"), /business continuity/i);
});

test("buildGrokMessages includes contrast line and X context", () => {
  const { system, user } = buildGrokMessages({
    verticalId: "packaging",
    brandName: "Packaging Jobs",
    contrastLine: "Package development — not plant ops.",
    tagline: "Package development — not plant ops.",
    boardUrl: "https://packaging.nicheboardjobs.com",
    sponsorUrl: "https://packaging.nicheboardjobs.com/sponsor",
    postType: "current-events",
    xTweets: [
      {
        id: "1",
        text: "CPG brands are hiring packaging engineers again.",
        authorId: "abc",
        createdAt: "2026-08-27T00:00:00.000Z",
        url: "https://x.com/i/web/status/1",
      },
    ],
    boardStats: { totalJobs: 52, ingestedAt: "2026-08-27T12:00:00.000Z" },
  });

  assert.match(system, /Contrast \+ one proof \+ one CTA/);
  assert.match(user, /Package development — not plant ops/);
  assert.match(user, /CPG brands are hiring packaging engineers/);
  assert.match(user, /52 live roles/);
});

test("pickFreshJob returns newest role with board URL", () => {
  const job = pickFreshJob({
    verticalId: "packaging",
    origin: "https://packaging.nicheboardjobs.com",
    excludeJobIds: [],
  });

  assert.ok(job);
  assert.match(job.url, /^https:\/\/packaging\.nicheboardjobs\.com\/jobs\//);
  assert.ok(job.title.length > 0);
  assert.ok(job.company.length > 0);
});

test("pickFreshJob respects excludeJobIds", () => {
  const first = pickFreshJob({
    verticalId: "packaging",
    origin: "https://packaging.nicheboardjobs.com",
  });
  assert.ok(first);

  const second = pickFreshJob({
    verticalId: "packaging",
    origin: "https://packaging.nicheboardjobs.com",
    excludeJobIds: [first.id],
  });

  if (second) {
    assert.notEqual(second.id, first.id);
  }
});
