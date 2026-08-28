import assert from "node:assert/strict";
import test from "node:test";
import { buildGrokMessages } from "./grok";
import { pickFreshJob } from "./jobs";
import { xSearchQuery } from "./x";
import {
  formatHashtag,
  parseGrokDraftResponse,
  reviewDraftTone,
  sanitizeHashtags,
} from "./voice";

test("xSearchQuery returns vertical-specific queries", () => {
  assert.match(xSearchQuery("packaging"), /packaging engineer/i);
  assert.match(xSearchQuery("packaging"), /-is:retweet/);
  assert.match(xSearchQuery("businesscontinuity"), /business continuity/i);
});

test("buildGrokMessages includes brand voice and JSON output format", () => {
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

  assert.match(system, /BRAND VOICE/);
  assert.match(system, /HASHTAGS/);
  assert.match(system, /valid JSON only/);
  assert.match(user, /Package development — not plant ops/);
  assert.match(user, /CPG brands are hiring packaging engineers/);
});

test("parseGrokDraftResponse extracts post and hashtags from JSON", () => {
  const parsed = parseGrokDraftResponse(
    JSON.stringify({
      post: "Package development — not plant ops.\n\nBrowse Packaging →",
      hashtags: ["PackagingEngineering", "Hiring", "CPGJobs"],
    }),
    "packaging",
    "current-events",
  );

  assert.match(parsed.post, /Package development — not plant ops/);
  assert.ok(parsed.hashtags.includes("PackagingEngineering"));
  assert.ok(parsed.hashtags.includes("CPGJobs"));
  assert.equal(parsed.hashtags.includes("Hiring"), false);
});

test("sanitizeHashtags filters banned generic tags", () => {
  const tags = sanitizeHashtags(
    ["DreamJob", "PackagingEngineering", "Jobs", "PackageDevelopment"],
    "packaging",
  );
  assert.ok(tags.includes("PackagingEngineering"));
  assert.equal(tags.includes("DreamJob"), false);
  assert.equal(tags.includes("Jobs"), false);
});

test("reviewDraftTone flags banned copy and inline hashtags", () => {
  const review = reviewDraftTone({
    draft: "Find your dream job today! #Hiring",
    verticalId: "packaging",
    contrastLine: "Package development — not plant ops.",
  });
  assert.equal(review.passed, false);
  assert.ok(review.warnings.some((w) => /dream job/i.test(w)));
  assert.ok(review.warnings.some((w) => /hashtags/i.test(w)));
});

test("formatHashtag adds hash prefix", () => {
  assert.equal(formatHashtag("PackagingEngineering"), "#PackagingEngineering");
  assert.equal(formatHashtag("#BCM"), "#BCM");
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
