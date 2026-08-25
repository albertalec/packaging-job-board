import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALERTS_FROM_EMAIL, CONTACT_EMAIL } from "../../config/email.ts";
import { hub, packaging } from "../../config/tenants.ts";

describe("email addresses", () => {
  it("uses one human contact on hub and vertical boards", () => {
    assert.equal(hub.contactEmail, CONTACT_EMAIL);
    assert.equal(packaging.contactEmail, CONTACT_EMAIL);
    assert.equal(CONTACT_EMAIL, "hello@nicheboardjobs.com");
  });

  it("keeps alerts on a separate outbound address", () => {
    assert.equal(ALERTS_FROM_EMAIL, "alerts@nicheboardjobs.com");
    assert.notEqual(ALERTS_FROM_EMAIL, CONTACT_EMAIL);
  });
});
