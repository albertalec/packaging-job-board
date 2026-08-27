import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cityStateFromDescription,
  enrichLocationWithCityState,
} from "./location.ts";

describe("enrichLocationWithCityState", () => {
  it("pulls Intermountain Work City / Work State into the location", () => {
    const description = `
Location:

Intermountain Health Intermountain Medical Center

Work City:

Murray

Work State:

Utah

Scheduled Weekly Hours:
`;
    const enriched = enrichLocationWithCityState(
      "Intermountain Health Intermountain Medical Center, United States of America",
      description,
    );
    assert.equal(
      enriched,
      "Murray, UT · Intermountain Health Intermountain Medical Center",
    );
    assert.deepEqual(cityStateFromDescription(description), {
      city: "Murray",
      stateCode: "UT",
      stateLabel: "Utah",
    });
  });

  it("distinguishes Riverton campus postings", () => {
    const description = `
Work City:

Riverton

Work State:

Utah
`;
    assert.equal(
      enrichLocationWithCityState(
        "Intermountain Health Riverton Hospital, United States of America",
        description,
      ),
      "Riverton, UT · Intermountain Health Riverton Hospital",
    );
  });

  it("strips HTML before reading Work City labels", () => {
    const description = `<p><b>Work City:</b></p>Murray<p><b>Work State:</b></p>Utah`;
    assert.equal(
      enrichLocationWithCityState(
        "Intermountain Health Intermountain Medical Center, United States of America",
        description,
      ),
      "Murray, UT · Intermountain Health Intermountain Medical Center",
    );
  });
});
