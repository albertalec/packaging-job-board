import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeHtmlEntities,
  htmlToPlainText,
  normalizeDescription,
  parseJobDescription,
  splitEmployerAbout,
} from "./description.ts";

describe("decodeHtmlEntities", () => {
  it("decodes numeric codes used by Workday", () => {
    assert.equal(decodeHtmlEntities("Bachelor&#39;s"), "Bachelor's");
    assert.equal(decodeHtmlEntities("2&#43; years"), "2+ years");
    assert.equal(decodeHtmlEntities("next.&#xa;JOB OVERVIEW"), "next.\nJOB OVERVIEW");
  });
});

describe("normalizeDescription", () => {
  it("breaks mashed ATS section labels into their own blocks", () => {
    const input =
      "and proven success with decision-making for results PREFERRED QUALIFICATIONS Bachelor&#39;s degree in Chemical Engineer, Mechanical Engineer, Food Engineering or other engineering degrees preferred 2&#43; years of direct food manufacturing experience";
    const blocks = parseJobDescription(input);
    assert.deepEqual(
      blocks.map((block) => block.type),
      ["paragraph", "heading", "paragraph"],
    );
    assert.equal(blocks[1]?.type === "heading" && blocks[1].text, "PREFERRED QUALIFICATIONS");
    const body = blocks[2];
    assert.equal(body?.type, "paragraph");
    if (body?.type === "paragraph") {
      assert.match(body.text, /^Bachelor's degree/);
      assert.match(body.text, /2\+ years/);
      assert.doesNotMatch(body.text, /&#/);
    }
  });

  it("merges Workday-split education and experience headings", () => {
    const input =
      "EDUCATION\n\nAND\n\nEXPERIENCE\n\n, YOU'LL BRING\nRequired\n\n• Bachelor's degree (or equivalent) is required\n\n• 5 years of experience in regulatory preferred\n\nPreferred\n\n• M.S. or Ph.D. degree";
    const blocks = parseJobDescription(input);
    const headings = blocks
      .filter((block) => block.type === "heading")
      .map((block) => (block.type === "heading" ? block.text : ""));
    assert.deepEqual(headings, ["EDUCATION AND EXPERIENCE YOU'LL BRING"]);
    assert.equal(blocks[1]?.type, "paragraph");
    if (blocks[1]?.type === "paragraph") {
      assert.equal(blocks[1].text, "Required");
    }
    const list = blocks.find((block) => block.type === "list");
    assert.equal(list?.type, "list");
    if (list?.type === "list") {
      assert.match(list.items[0] ?? "", /Bachelor's degree/);
    }
    assert.doesNotMatch(
      blocks.map((block) => ("text" in block ? block.text : "")).join("\n"),
      /^\s*AND\s*$/m,
    );
  });

  it("treats standalone employer section labels as headings", () => {
    const blocks = parseJobDescription(
      "The Opportunity\n\nThis position works out of our Abbott Park, IL location in the Nutrition Division.\n\nWhat You'll Work On\n\nPrimary Function/Primary Goals/Objectives:\n1. Combine knowledge of scientific, regulatory and business issues.",
    );
    const headings = blocks
      .filter((block) => block.type === "heading")
      .map((block) => (block.type === "heading" ? block.text : ""));
    assert.deepEqual(headings, ["The Opportunity", "What You'll Work On"]);
    assert.equal(blocks[1]?.type, "paragraph");
    if (blocks[1]?.type === "paragraph") {
      assert.match(blocks[1].text, /Abbott Park, IL/);
    }
  });

  it("does not promote short labels or prose lines to headings", () => {
    const blocks = parseJobDescription(
      "Required\n\n• Bachelor's degree\n\nPreferred\n\n• M.S. degree\n\nJoin us and become part of the power behind possible.\n\nPackaging Manager\n\nLead the packaging team.",
    );
    assert.deepEqual(
      blocks.filter((block) => block.type === "heading"),
      [],
    );
    assert.equal(blocks[0]?.type, "paragraph");
    if (blocks[0]?.type === "paragraph") {
      assert.equal(blocks[0].text, "Required");
    }
  });

  it("promotes title-case list intro labels before bullet blocks", () => {
    const input =
      "What you will be responsible for\n\nOperational Resilience & Crisis Management\n\n• Provide strategic leadership of Operational Resilience\n\n• Lead scenario testing\n\nGovernance, Risk Management & Regulatory Alignment\n\n• Own and enhance governance frameworks\n\n• Ensure alignment with regulatory requirements\n\nStakeholder Engagement & Influential Leadership\n\n• Act as a senior liaison across Technology, Business, and Risk functions";
    const blocks = parseJobDescription(input);
    const headings = blocks
      .filter((block) => block.type === "heading")
      .map((block) => (block.type === "heading" ? block.text : ""));
    assert.deepEqual(headings, [
      "Operational Resilience & Crisis Management",
      "Governance, Risk Management & Regulatory Alignment",
      "Stakeholder Engagement & Influential Leadership",
    ]);
    assert.equal(blocks[0]?.type, "paragraph");
    if (blocks[0]?.type === "paragraph") {
      assert.equal(blocks[0].text, "What you will be responsible for");
    }
  });

  it("does not promote single-word list labels or rhetorical questions", () => {
    const blocks = parseJobDescription(
      "Knowledge:\n\n• Strong knowledge and application of BCM practices.\n\nWhy Horizon?\n\nAt Horizon, you'll do meaningful work that directly improves lives.",
    );
    assert.deepEqual(
      blocks.filter((block) => block.type === "heading"),
      [],
    );
  });

  it("parses flattened competency rubrics into rubric blocks", () => {
    const input =
      "Functional Competency\n\nBehavioral Description\n\nProcess Knowledge\n\nPerforming\n\nDemonstrates knowledge of procedures and department processes.\n\nSystem Knowledge\n\nPerforming\n\nDemonstrates knowledge of specific programs and applications.";
    const blocks = parseJobDescription(input);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.type, "rubric");
    if (blocks[0]?.type !== "rubric") return;
    assert.equal(blocks[0].rows.length, 2);
    assert.deepEqual(blocks[0].rows[0], {
      competency: "Process Knowledge",
      level: "Performing",
      description:
        "Demonstrates knowledge of procedures and department processes.",
    });
  });

  it("serializes competency tables from HTML during ingest conversion", () => {
    const html =
      "<table><tr><td><p>Process Knowledge</p></td><td><p>Performing</p></td><td><p>Demonstrates knowledge of procedures.</p></td></tr><tr><td><p>System Knowledge</p></td><td><p>Performing</p></td><td><p>Demonstrates knowledge of systems.</p></td></tr></table>";
    const blocks = parseJobDescription(htmlToPlainText(html));
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.type, "rubric");
    if (blocks[0]?.type !== "rubric") return;
    assert.equal(blocks[0].rows.length, 2);
    assert.equal(blocks[0].rows[0]?.competency, "Process Knowledge");
  });

  it("does not treat lowercase 'experience' as a section heading", () => {
    const blocks = parseJobDescription(
      "5 years of packaging experience working in CPG packaging or other relevant industry",
    );
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.type, "paragraph");
  });

  it("does not split on 'eligibility:' in running compensation copy", () => {
    const blocks = parseJobDescription(
      "Bonus based on performance and eligibility: Medical, Dental, Vision",
    );
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.type, "paragraph");
  });

  it("treats 'Your role at Clorox:' as a heading", () => {
    const blocks = parseJobDescription(
      "Join our team. Your role at Clorox: The Research and Development organization is embedded within each business.",
    );
    assert.deepEqual(
      blocks.map((block) => block.type),
      ["paragraph", "heading", "paragraph"],
    );
    assert.equal(blocks[1]?.type === "heading" && blocks[1].text, "Your role at Clorox");
  });

  it("does not split 'salary range' inside compensation copy", () => {
    const input =
      "General Mills will not sponsor applicants for this position for work visas. SALARY RANGE The salary range for this position is: $95,300 - $143,200 Annual At General Mills we strive for each employee's pay to reflect their experience. The salary range for this role represents skills, work experience, and certifications.";
    const blocks = parseJobDescription(input);
    const salaryHeadings = blocks.filter(
      (block) =>
        block.type === "heading" && /salary range/i.test(block.text),
    );
    assert.equal(salaryHeadings.length, 1);
    assert.equal(salaryHeadings[0]?.type === "heading" && salaryHeadings[0].text, "SALARY RANGE");
    const body = blocks
      .filter((block) => block.type === "paragraph")
      .map((block) => (block.type === "paragraph" ? block.text : ""))
      .join(" ");
    assert.match(body, /The salary range for this position is: \$95,300/);
    assert.match(body, /The salary range for this role represents/);
    assert.doesNotMatch(body, /^salary range$/m);
  });

  it("is safe to run more than once", () => {
    const once = normalizeDescription(
      "COMPANY OVERVIEW We exist to make food. MINIMUM QUALIFICATIONS Bachelor&#39;s degree",
    );
    assert.equal(normalizeDescription(once), once);
  });

  it("turns Autoliv perks and EEO into a list plus a legal section", () => {
    const input =
      "What is required: Bachelor’s degree in Packaging Engineering. 10+ years of packaging engineering experience. What’s in it for you: •Attractive compensation package •Recognition awards, company events, university discount options and many more perks. •Gender Pay Equality Autoliv is proud to be an equal opportunity employer. Autoliv does not discriminate in any aspect of employment based on race, color, religion, national origin, ancestry, gender, sexual orientation, gender identify and/or expression, age, disability, or any other characteristic protected by federal, state, or local employment discrimination laws where Autoliv does business.";
    const blocks = parseJobDescription(input);
    const headings = blocks
      .filter((block) => block.type === "heading")
      .map((block) => (block.type === "heading" ? block.text : ""));
    assert.deepEqual(headings, [
      "What is required",
      "What’s in it for you",
      "Equal opportunity employer",
    ]);
    const perks = blocks.find((block) => block.type === "list");
    assert.equal(perks?.type, "list");
    if (perks?.type === "list") {
      assert.equal(perks.items.length, 3);
      assert.ok(perks.items.some((item) => /Attractive compensation package/i.test(item)));
      assert.ok(perks.items.some((item) => /Gender Pay Equality/i.test(item)));
      assert.ok(perks.items.every((item) => !/does not discriminate/i.test(item)));
    }
    const eeo = blocks.find(
      (block) =>
        block.type === "paragraph" && /does not discriminate/i.test(block.text),
    );
    assert.equal(eeo?.type, "paragraph");
    if (eeo?.type === "paragraph") {
      assert.match(eeo.text, /Autoliv is proud to be an equal opportunity employer/);
    }
  });
});

describe("htmlToPlainText", () => {
  it("keeps paragraphs and list items instead of flattening to one line", () => {
    const text = htmlToPlainText(
      "<p><b>JOB OVERVIEW</b></p><p>Lead packaging R&amp;D.</p><ul><li>Flexible films</li><li>Rigid plastics</li></ul>",
    );
    const blocks = parseJobDescription(text);
    assert.deepEqual(
      blocks.map((block) =>
        block.type === "list" ? { type: block.type, items: block.items } : block,
      ),
      [
        { type: "heading", text: "JOB OVERVIEW" },
        { type: "paragraph", text: "Lead packaging R&D." },
        { type: "list", items: ["Flexible films", "Rigid plastics"] },
      ],
    );
  });
});

describe("splitEmployerAbout", () => {
  it("moves company overview copy into the about panel and leaves the role body", () => {
    const { about, rest } = splitEmployerAbout(
      parseJobDescription(
        "COMPANY OVERVIEW\n\nWe exist to make food the world loves.\n\nJOB OVERVIEW\n\nLead packaging R&D for Pet brands.",
      ),
    );
    assert.equal(about.length, 1);
    assert.equal(
      about[0]?.type === "paragraph" && about[0].text,
      "We exist to make food the world loves.",
    );
    assert.deepEqual(
      rest.map((block) =>
        block.type === "heading" || block.type === "paragraph"
          ? block.text
          : block.type,
      ),
      ["JOB OVERVIEW", "Lead packaging R&D for Pet brands."],
    );
  });
});
