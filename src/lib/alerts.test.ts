import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { NormalizedJob } from "../../ingest/types";
import { packaging } from "@config/packaging";
import { jobsForSubscriber, normalizeAlertFilters } from "./alerts";
import {
  buildConfirmEmail,
  buildDigestEmail,
  buildWelcomeEmail,
} from "./alerts-mail";

test("normalizeAlertFilters accepts niche and state", () => {
  assert.deepEqual(normalizeAlertFilters({ niche: "CPG", state: "mn" }), {
    niche: "cpg",
    state: "MN",
  });
  assert.deepEqual(normalizeAlertFilters({ niche: "nope", state: "Minnesota" }), {
    niche: null,
    state: null,
  });
});

test("jobsForSubscriber skips notified and respects filters", () => {
  const jobs: NormalizedJob[] = [
    {
      id: "a",
      sourceId: "1",
      hash: "h1",
      company: "Clorox",
      companySlug: "clorox",
      title: "Packaging Engineer",
      department: null,
      location: "Oakland, CA",
      state: "CA",
      remote: false,
      postedAt: null,
      applyUrl: "https://example.com/a",
      description: "x",
      salary: null,
      niche: "cpg",
      source: "workday",
    },
    {
      id: "b",
      sourceId: "2",
      hash: "h2",
      company: "Autoliv",
      companySlug: "autoliv",
      title: "Packaging Engineer",
      department: null,
      location: "Ogden, UT",
      state: "UT",
      remote: false,
      postedAt: null,
      applyUrl: "https://example.com/b",
      description: "x",
      salary: null,
      niche: "automotive",
      source: "workday",
    },
  ];

  const filtered = jobsForSubscriber(jobs, {
    email: "a@example.com",
    token: "tok",
    vertical: "packaging",
    status: "active",
    createdAt: new Date().toISOString(),
    niche: "cpg",
    state: null,
    notifiedJobIds: [],
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "a");

  const afterNotify = jobsForSubscriber(jobs, {
    email: "a@example.com",
    token: "tok",
    vertical: "packaging",
    status: "active",
    createdAt: new Date().toISOString(),
    niche: null,
    state: null,
    notifiedJobIds: ["a", "b"],
  });
  assert.equal(afterNotify.length, 0);
});

test("branded welcome email uses tenant theme and mark", () => {
  const message = buildWelcomeEmail({
    tenant: packaging,
    origin: "https://packaging.nicheboardjobs.com",
    unsubscribeUrl:
      "https://packaging.nicheboardjobs.com/alerts/unsubscribe?token=abc",
  });

  assert.match(message.subject, /subscribed/i);
  assert.match(message.html, /Source Serif 4/);
  assert.match(message.html, /You’re subscribed/);
  assert.ok(message.html.includes(packaging.theme.paper));
  assert.match(message.html, /Unsubscribe/);
});

test("branded confirm email uses tenant theme and mark", () => {
  const message = buildConfirmEmail({
    tenant: packaging,
    origin: "https://packaging.nicheboardjobs.com",
    confirmUrl: "https://packaging.nicheboardjobs.com/alerts/confirm?token=abc",
    unsubscribeUrl:
      "https://packaging.nicheboardjobs.com/alerts/unsubscribe?token=abc",
  });

  assert.match(message.subject, /Packaging Jobs/);
  assert.match(message.html, /Source Serif 4/);
  assert.match(message.html, /IBM Plex Sans/);
  assert.ok(message.html.includes(packaging.theme.paper));
  assert.ok(message.html.includes(packaging.theme.kraft));
  assert.ok(message.html.includes(packaging.theme.accent));
  assert.match(message.html, /Packaging/);
  assert.match(message.html, /Confirm alerts/);
  assert.match(message.html, /Unsubscribe/);
  assert.match(message.text, /Unsubscribe/);
});

test("branded digest email renders job cards", () => {
  const message = buildDigestEmail({
    tenant: packaging,
    origin: "https://packaging.nicheboardjobs.com",
    unsubscribeUrl:
      "https://packaging.nicheboardjobs.com/alerts/unsubscribe?token=abc",
    jobs: [
      {
        id: "a",
        title: "Senior Packaging Engineer",
        company: "General Mills",
        location: "Minneapolis, MN",
        niche: "food-beverage",
        remote: false,
        url: "https://packaging.nicheboardjobs.com/jobs/a",
        applyUrl: "https://careers.example.com/a",
      },
    ],
  });

  assert.match(message.subject, /1 new role/);
  assert.match(message.html, /Senior Packaging Engineer/);
  assert.match(message.html, /General Mills/);
  assert.match(message.html, /Apply on career site/);
  assert.match(message.html, /box-shadow:3px 3px 0/);
  assert.match(message.text, /Senior Packaging Engineer/);
});

test("alerts local store round-trips pending → active → remove", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "alerts-"));
  const previousCwd = process.cwd();
  process.chdir(dir);
  try {
    const store = await import("./alerts-store.ts");
    const pending = await store.upsertPendingSubscriber({
      vertical: "packaging",
      email: "Ada@Example.com",
      token: "token-1",
      niche: "cpg",
      state: "CA",
    });
    assert.equal(pending.email, "ada@example.com");
    assert.equal(pending.status, "pending");

    const confirmed = await store.confirmSubscriber("packaging", "token-1");
    assert.equal(confirmed?.status, "active");

    const removed = await store.removeSubscriber("packaging", "token-1");
    assert.equal(removed?.email, "ada@example.com");
    const after = await store.findSubscriberByToken("packaging", "token-1");
    assert.equal(after, undefined);
  } finally {
    process.chdir(previousCwd);
    rmSync(dir, { recursive: true, force: true });
  }
});
