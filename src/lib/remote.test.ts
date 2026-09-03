import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { isRemote } from "./remote";

describe("isRemote", () => {
  it("flags remote/hybrid in the location field", () => {
    assert.equal(isRemote("Remote - United States", ""), true);
    assert.equal(isRemote("Hybrid - Chicago, IL", "On-site lab work required"), true);
    assert.equal(isRemote("Work From Home", ""), true);
  });

  it("flags LinkedIn #LI-Hybrid / #LI-Remote tags deep in the description", () => {
    const padding = "x".repeat(500);
    assert.equal(
      isRemote("Chicago, IL", `${padding}\n#LI-Hybrid\n#LI-MH1\nCompensation`),
      true,
    );
    assert.equal(
      isRemote("Austin, TX", `${padding} See details. #LI-Remote Apply today.`),
      true,
    );
  });

  it("flags workplace arrangement labels", () => {
    assert.equal(
      isRemote(
        "Pleasanton, CA",
        "What we look for\n\nWorkplace type:\nHybrid - 3 days a week in office; 2 days a week at home",
      ),
      true,
    );
    assert.equal(
      isRemote(
        "Orrville, OH",
        "Location: Orrville, OH\nWork Arrangements : Hybrid, 60% or more in office presence",
      ),
      true,
    );
    assert.equal(
      isRemote(
        "Tempe, Arizona",
        "Work Flexibility: Hybrid Senior Medical Packaging Engineer Tempe, AZ",
      ),
      true,
    );
    assert.equal(
      isRemote(
        "Princeton, NJ",
        "Work Environment\n\n• Hybrid: The role will be based in Princeton, NJ and requires in-person attendance on Tuesdays, Wednesdays, and Thursdays, with remote work options on Mondays and Fridays.",
      ),
      true,
    );
  });

  it("flags Hybrid/Flex and remote-work phrasing", () => {
    assert.equal(
      isRemote(
        "Minneapolis, MN",
        "This position will operate as a Hybrid/Flex for Your Day work arrangement based on Target’s needs.",
      ),
      true,
    );
    assert.equal(
      isRemote(
        "Racine, WI",
        "• Remote work is available once per week for eligible employees",
      ),
      true,
    );
    assert.equal(
      isRemote("Boston, MA", "This is a fully remote role open to US candidates."),
      true,
    );
  });

  it("ignores product language and remote negations", () => {
    assert.equal(
      isRemote(
        "Utah, USA",
        "Drive standardization of returnable, expendable, and hybrid packaging systems across programs and regions.",
      ),
      false,
    );
    assert.equal(
      isRemote(
        "Minneapolis, MN",
        "General Mills would provide relocation support if the selected candidate meets organizational standards, but international relocation and remote assignments will not be considered.",
      ),
      false,
    );
    assert.equal(
      isRemote(
        "Columbus, OH",
        "MISC:\n• This is an on-site role - not a remote role.\n• Sponsorship: we will not provide sponsorship",
      ),
      false,
    );
  });

  it("does not flag ordinary on-site packaging roles", () => {
    assert.equal(
      isRemote(
        "Neenah, WI",
        "The Packaging Engineer will develop primary and secondary packaging for consumer products. Lab and plant trials required.",
      ),
      false,
    );
  });

  it("classifies live packaging jobs consistently with description signals", () => {
    const data = JSON.parse(
      readFileSync("data/packaging/jobs.json", "utf8"),
    ) as {
      jobs: Array<{
        id: string;
        company: string;
        title: string;
        location: string;
        description: string;
      }>;
    };

    const expectedRemoteIds = new Set([
      "kenvue-024b17f1e272cc99",
      "clorox-8a646b90ca3a3a75",
      "clorox-af0c26e688937e1b",
      "clorox-1b8d9dfabeaa2782",
      "conagra-003fc6feb067a106",
      "conagra-df4f4054f2215cfd",
      "conagra-0946e7bb432acfb7",
      "church-dwight-b9c080251de3ed5f",
      "church-dwight-1933d7b7f02d653d",
      "sc-johnson-7db82df72eaeba5f",
      "smucker-34a0178560e3504f",
      "smucker-77fa50d2b26ccf3b",
      "stryker-f6bf296edfd7cb75",
      "colgate-1e9b5003000083bb",
      "medtronic-b546cfbe0bcd22db",
    ]);

    for (const job of data.jobs) {
      const got = isRemote(job.location, job.description);
      const want = expectedRemoteIds.has(job.id);
      assert.equal(
        got,
        want,
        `${job.company}: ${job.title} (${job.id}) → expected remote=${want}, got ${got}`,
      );
    }
  });
});
