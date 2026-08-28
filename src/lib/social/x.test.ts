import assert from "node:assert/strict";
import test from "node:test";
import { describeXSearchResult } from "./x";

test("describeXSearchResult explains empty and error states", () => {
  assert.match(
    describeXSearchResult({
      ok: false,
      skipped: true,
      error: "missing",
      query: "q",
    }),
    /skipped/,
  );

  assert.match(
    describeXSearchResult({
      ok: false,
      error: "Forbidden",
      query: "q",
    }),
    /failed: Forbidden/,
  );

  assert.match(
    describeXSearchResult(
      { ok: true, query: "packaging", tweets: [], rawCount: 0 },
      0,
      "packaging",
    ),
    /returned 0 posts/,
  );

  assert.match(
    describeXSearchResult(
      {
        ok: true,
        query: "packaging engineer",
        tweets: [{ id: "1", text: "hi", authorId: "a", createdAt: "", url: "u" }],
        rawCount: 1,
      },
      1,
    ),
    /1 post\(s\)/,
  );
});
