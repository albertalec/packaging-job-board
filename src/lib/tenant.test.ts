import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatUsd,
  getTenant,
  getVertical,
  isLocalHost,
  requestOrigin,
  resolveTenantId,
  tenantOrigin,
} from "../../config/tenants.ts";
import { parseVerticalArg } from "../../ingest/args.ts";
import { sponsorshipBlobName } from "./sponsorship-store.ts";

describe("resolveTenantId", () => {
  it("maps packaging and hub hosts", () => {
    assert.equal(resolveTenantId("packaging.nicheboard.com"), "packaging");
    assert.equal(resolveTenantId("nicheboard.com"), "hub");
    assert.equal(resolveTenantId("www.nicheboard.com"), "hub");
    assert.equal(resolveTenantId("packaging.localhost:3000"), "packaging");
    assert.equal(resolveTenantId("nicheboard.localhost:3000"), "hub");
  });

  it("defaults local and Vercel preview hosts to packaging", () => {
    assert.equal(resolveTenantId("localhost:3000"), "packaging");
    assert.equal(resolveTenantId("127.0.0.1:3000"), "packaging");
    assert.equal(
      resolveTenantId("packaging-job-board.vercel.app"),
      "packaging",
    );
  });

  it("honors TENANT_HOST and DEFAULT_VERTICAL", () => {
    assert.equal(
      resolveTenantId("localhost:3000", { TENANT_HOST: "nicheboard.com" }),
      "hub",
    );
    assert.equal(
      resolveTenantId("localhost:3000", { DEFAULT_VERTICAL: "hub" }),
      "hub",
    );
  });

  it("404s unknown public hosts", () => {
    assert.equal(resolveTenantId("evil.example.com"), null);
  });
});

describe("tenantOrigin", () => {
  it("uses .localhost when the incoming host is local", () => {
    const packaging = getTenant("packaging");
    const hub = getTenant("hub");
    assert.equal(
      tenantOrigin(packaging, {
        hostHeader: "nicheboard.localhost:3000",
        proto: "http",
      }),
      "http://packaging.localhost:3000",
    );
    assert.equal(
      tenantOrigin(hub, {
        hostHeader: "localhost:3000",
        proto: "http",
      }),
      "http://nicheboard.localhost:3000",
    );
  });

  it("keeps Vercel preview origin for packaging", () => {
    const packaging = getTenant("packaging");
    assert.equal(
      tenantOrigin(packaging, {
        hostHeader: "packaging-job-board.vercel.app",
        proto: "https",
      }),
      "https://packaging-job-board.vercel.app",
    );
  });

  it("uses canonical hosts in production", () => {
    assert.equal(
      tenantOrigin(getTenant("packaging"), {
        hostHeader: "packaging.nicheboard.com",
        proto: "https",
      }),
      "https://packaging.nicheboard.com",
    );
    assert.equal(
      tenantOrigin(getTenant("hub"), {
        hostHeader: "www.nicheboard.com",
        proto: "https",
      }),
      "https://nicheboard.com",
    );
  });
});

describe("requestOrigin", () => {
  it("preserves the incoming host for Stripe redirects", () => {
    assert.equal(
      requestOrigin({
        hostHeader: "packaging.localhost:3000",
        proto: "http",
      }),
      "http://packaging.localhost:3000",
    );
  });
});

describe("helpers", () => {
  it("formats whole-dollar sponsor prices without cents", () => {
    assert.equal(formatUsd(10_000), "$100");
    assert.equal(formatUsd(12_550), "$125.50");
  });

  it("scopes blob keys per vertical", () => {
    assert.equal(sponsorshipBlobName("packaging"), "sponsorships/packaging.json");
    assert.notEqual(
      sponsorshipBlobName("packaging"),
      sponsorshipBlobName("supplychain"),
    );
  });

  it("rejects hub as a vertical", () => {
    assert.equal(getTenant("hub").kind, "hub");
    assert.throws(() => getVertical("hub"), /Not a vertical tenant/);
  });

  it("treats localhost aliases as local", () => {
    assert.equal(isLocalHost("localhost"), true);
    assert.equal(isLocalHost("packaging.localhost"), true);
    assert.equal(isLocalHost("packaging.nicheboard.com"), false);
  });
});

describe("parseVerticalArg", () => {
  it("reads --vertical and INGEST_VERTICAL", () => {
    assert.equal(parseVerticalArg(["--vertical=packaging"]), "packaging");
    assert.equal(parseVerticalArg(["--vertical", "packaging"]), "packaging");
    assert.equal(
      parseVerticalArg([], { INGEST_VERTICAL: "packaging" }),
      "packaging",
    );
    assert.equal(parseVerticalArg([]), "packaging");
  });

  it("does not treat the next flag as a vertical id", () => {
    assert.equal(parseVerticalArg(["--vertical", "--help"]), "packaging");
  });
});
