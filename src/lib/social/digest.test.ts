import assert from "node:assert/strict";
import test from "node:test";
import { defaultPostTypeForUtcDay } from "./digest";
import { buildLinkedInDraftEmail } from "./mail";
import { packaging } from "@config/packaging";

test("defaultPostTypeForUtcDay maps Tue/Thu UTC", () => {
  assert.equal(
    defaultPostTypeForUtcDay(new Date("2026-08-25T12:00:00.000Z")),
    "current-events",
  );
  assert.equal(
    defaultPostTypeForUtcDay(new Date("2026-08-27T12:00:00.000Z")),
    "fresh-role",
  );
  assert.equal(
    defaultPostTypeForUtcDay(new Date("2026-08-26T12:00:00.000Z")),
    null,
  );
});

test("buildLinkedInDraftEmail includes draft text", () => {
  const message = buildLinkedInDraftEmail({
    tenant: packaging,
    origin: "https://packaging.nicheboardjobs.com",
    result: {
      vertical: "packaging",
      postType: "current-events",
      ok: true,
      draft: "Package development — not plant ops.\n\nBrowse Packaging →",
      hashtags: ["PackagingEngineering", "PackageDevelopment", "CPGJobs"],
      errors: [],
      xTweets: [
        {
          id: "1",
          text: "Hiring packaging engineers in CPG again.",
          authorId: "a",
          createdAt: "2026-08-27T00:00:00.000Z",
          url: "https://x.com/i/web/status/1",
        },
      ],
      job: {
        id: "j1",
        title: "Packaging Engineer",
        company: "Clorox",
        url: "https://packaging.nicheboardjobs.com/jobs/j1",
      },
    },
  });

  assert.match(message.subject, /LinkedIn draft/);
  assert.match(message.text, /Package development — not plant ops/);
  assert.match(message.text, /#PackagingEngineering/);
  assert.match(message.text, /Clorox/);
  assert.match(message.html, /LinkedIn draft/);
});
