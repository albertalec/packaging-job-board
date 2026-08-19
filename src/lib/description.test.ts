import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeHtmlEntities,
  htmlToPlainText,
  normalizeDescription,
  parseJobDescription,
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

  it("is safe to run more than once", () => {
    const once = normalizeDescription(
      "COMPANY OVERVIEW We exist to make food. MINIMUM QUALIFICATIONS Bachelor&#39;s degree",
    );
    assert.equal(normalizeDescription(once), once);
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
