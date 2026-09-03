import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("ingestTalentBrew parsing", () => {
  it("parses search hits and job posting JSON-LD", () => {
    const searchHtml = `
      <section data-total-pages="3">
        <a href="/job/minnesota/disaster-recovery-resiliency-analyst/34088/99721857344" data-job-id="99721857344">
          <h2>Disaster Recovery Resiliency Analyst</h2>
        </a>
      </section>`;
    const hits = [
      ...searchHtml.matchAll(
        /<a href="(\/job\/[^"]+)"[^>]*data-job-id="(\d+)"[\s\S]*?<h2>([^<]+)<\/h2>/g,
      ),
    ];
    assert.equal(hits.length, 1);
    assert.equal(hits[0][2], "99721857344");
    assert.match(hits[0][3], /Disaster Recovery/i);

    const jobHtml = `<script type="application/ld+json">{"@type":"JobPosting","title":"Disaster Recovery Resiliency Analyst","description":"<p>Disaster Recovery plan management</p>","datePosted":"2026-8-25","jobLocation":{"address":{"addressLocality":"Eden Prairie","addressRegion":"MN","addressCountry":"US"}}}</script>`;
    const ldMatch = jobHtml.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    assert.ok(ldMatch);
    const posting = JSON.parse(ldMatch[1]) as {
      title?: string;
      description?: string;
    };
    assert.match(posting.title ?? "", /Disaster Recovery Resiliency Analyst/i);
    assert.match(posting.description ?? "", /Disaster Recovery plan management/i);
  });
});
