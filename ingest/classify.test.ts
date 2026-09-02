import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyJob, isUsOrRemote } from "./classify.ts";

function verdict(
  title: string,
  extra?: { description?: string; department?: string | null },
) {
  return classifyJob({
    title,
    description: extra?.description ?? title,
    department: extra?.department ?? null,
  });
}

const KEEP = [
  "Associate R&D Principal Packaging Engineer - E-Commerce Pet",
  "Internship - Research & Development Packaging Engineer",
  "Research & Development Packaging Engineer - Campus Recruiting",
  "Packaging Engineer II",
  "Engineer II, Packaging",
  "Senior Packaging Systems Engineer",
  "Packaging Materials Senior Engineer",
  "R&D Packaging Scientist 1 (Recent Grad Starting in 2026)",
  "Packaging Engineer",
  "Principal Packaging Engineer",
  "Senior Packaging Engineer",
  "Senior Manufacturing Engineer, Packaging",
  "Sr. CPG Package Designer",
  "Senior Associate – Packaging Engineer for International Brands Pest Control",
  "Senior Technologist, Packaging Research & Development, Pet",
  "Packaging Engineering Intern- 2027, 6-8 month Co-Op",
  "Engineer, Packaging Development",
  "Packaging Manager",
  "Packaging Engineer AOA",
  "Packaging Lead Engineer",
  "Eng, Packaging",
  "Custom Packaging Design Engineer Co-Op (Spring 2027)",
  "Foods Packaging Senior Principal Engineer",
  "Senior Industrial Designer – Structural Packaging",
  "2026 Co-Op:  R&D Packaging",
  "Senior Package Engineer",
  "Staff Packaging Engineer: Surgical Robotics – OTTAVA",
  "Converting Engineer",
  "Returnable Packaging Engineer",
  "Manager Packaging Innovation & Development",
  "Packaging Sciences Apprentice",
  "Packaging Compliance Manager/Packaging Engineer in Regulatory Affairs",
  "Device and Packaging Technologist",
  "Associate Packaging Engineer- Essentials, Beauty, Pets, and Baby",
  "Scientist: Steriles Packaging Development",
];

const DROP = [
  "KCNA Procurement Sr. Specialist, Packaging - Cartons",
  "Associate Creative Director, Packaging & Print",
  "Associate Procurement Director: Printing & Specialty Packaging",
  "Category Manager - Flexible Packaging (Labels, Bags, Sleeves)",
  "Category Management Specialist-Packaging & Specialty Materials",
  "Principal Engineer - Packaging Equipment",
  "Senior Manager, Packaging Procurement",
  "Packaging Fleet Budget Coordinator",
  "3rd Shift Corrugator Supervisor",
  "Corrugator Specialist",
  "Corrugated Supervisor",
  "Senior Manager, Drug Product Device Assembly and Packaging (DAP)  System User",
  "Sr. Principal Process Engineer –Packaging",
  "Senior Packaging Delivery Leader, Oral Care",
  "Account Manager - Healthcare Packaging - Tyvek® (Remote)",
  "Package Handler",
  "Night Shift Finishing Operator",
  "Plant Electrician",
  "Application Packaging Engineer",
  "Process Lead - Packaging",
  "Packaging Operator",
  "Manager Packaging Production",
  "Department Manager - Aseptic Packaging Operation - Casa Grande, AZ",
  "Manager, Brand Applications (Packaging)",
  "Project Manager Label Packaging",
  "Manufacturing Packaging Engineer - Covington, GA",
  "Manufacturing Process & Packaging Systems Engineer",
  "Manufacturing Process and Packaging Engineer - Joplin, MO",
  "Sr. Manufacturing Process and Packaging Engineer - Chanhassen, MN",
  "Manager- Manufacturing & Packaging Lead Engineer",
  "Inspection Assembly & Packaging Operations Manager",
  "Commodity Risk Manager, Energy & Packaging",
  "Senior Manager, Oral Care & Packaging",
];

describe("classifyJob", () => {
  for (const title of KEEP) {
    it(`keeps ${title}`, () => {
      const result = verdict(title);
      assert.equal(result.keep, true, result.reason);
    });
  }

  for (const title of DROP) {
    it(`drops ${title}`, () => {
      const result = verdict(title);
      assert.equal(result.keep, false, result.reason);
    });
  }

  it("drops sales roles even when the department is the only signal", () => {
    const result = verdict("Healthcare Packaging Specialist", {
      department: "Sales & Marketing",
    });
    assert.equal(result.keep, false);
    assert.equal(result.reason, "off-target function");
  });

  it("keeps every title currently stored in packaging jobs.json", () => {
    const data = JSON.parse(readFileSync("data/packaging/jobs.json", "utf8")) as {
      jobs: Array<{
        title: string;
        description: string;
        department: string | null;
        company: string;
      }>;
    };
    assert.ok(data.jobs.length > 0);
    for (const job of data.jobs) {
      const result = classifyJob({
        title: job.title,
        description: job.description,
        department: job.department,
      });
      assert.equal(
        result.keep,
        true,
        `${job.company}: ${job.title} (${result.reason})`,
      );
    }
  });
});

describe("isUsOrRemote", () => {
  it("drops foreign hybrid roles flagged remote in the description", () => {
    assert.equal(
      isUsOrRemote({
        state: null,
        remote: true,
        location: "Latin America, Colombia, Valle del Cauca, Cali, Colombia",
        sourceId:
          "/job/Latin-America-Colombia-Valle-del-Cauca-Cali/Packaging-Engineer_2607047814W",
        applyUrl:
          "https://kenvue.wd5.myworkdayjobs.com/kenvue/job/Latin-America-Colombia-Valle-del-Cauca-Cali/Packaging-Engineer_2607047814W",
      }),
      false,
    );
  });

  it("keeps US hybrid roles with a state", () => {
    assert.equal(
      isUsOrRemote({
        state: "GA",
        remote: true,
        location: "Alpharetta, GA - USA, United States of America",
      }),
      true,
    );
  });

  it("drops Canada-only listings", () => {
    assert.equal(
      isUsOrRemote({
        state: null,
        remote: false,
        location: "Mississauga, ON, Canada",
      }),
      false,
    );
  });

  it("keeps Workday multi-location US collapse for USA employers", () => {
    assert.equal(
      isUsOrRemote(
        { state: null, remote: false, location: "4 Locations" },
        { homeCountry: "USA" },
      ),
      true,
    );
  });

  it("keeps SuccessFactors-style locations ending in , US", () => {
    assert.equal(
      isUsOrRemote({
        state: null,
        remote: false,
        location: "Nationwide, US",
      }),
      true,
    );
    assert.equal(
      isUsOrRemote({
        state: null,
        remote: true,
        location: "Remote, US",
      }),
      true,
    );
  });
});
