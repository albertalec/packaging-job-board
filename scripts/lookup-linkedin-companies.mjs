#!/usr/bin/env node
/**
 * Look up LinkedIn company page URLs via DuckDuckGo (does not scrape LinkedIn).
 *
 *   node scripts/lookup-linkedin-companies.mjs
 *   node scripts/lookup-linkedin-companies.mjs --company="General Mills"
 *   node scripts/lookup-linkedin-companies.mjs --tier=p0 --write
 *
 * Updates data/linkedin-companies.json for rows missing linkedinUrl.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linkedinPath = path.join(root, "data/linkedin-companies.json");
const jobsPath = path.join(root, "data/packaging/jobs.json");

const args = process.argv.slice(2);
const tier = args.find((a) => a.startsWith("--tier="))?.split("=")[1] ?? "p0";
const write = args.includes("--write");
const oneCompany = args.find((a) => a.startsWith("--company="))?.split("=")[1];
const delayMs = Number(args.find((a) => a.startsWith("--delay="))?.split("=")[1] ?? 1500);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeDdgRedirect(href) {
  if (!href) return null;
  if (href.startsWith("//")) href = `https:${href}`;
  if (href.includes("uddg=")) {
    const u = new URL(href, "https://duckduckgo.com");
    return decodeURIComponent(u.searchParams.get("uddg") ?? "");
  }
  return href;
}

function extractLinkedInCompanyUrl(html) {
  const matches = html.matchAll(
    /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_%\-]+/gi,
  );
  for (const m of matches) {
    let url = m[0].replace(/[)"'<>]+$/, "");
    if (!url.endsWith("/")) url += "/";
    return url;
  }
  return null;
}

async function searchLinkedInUrl(companyName) {
  const q = encodeURIComponent(`site:linkedin.com/company ${companyName}`);
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NicheBoardLinkedInLookup/1.0; +https://nicheboardjobs.com)",
    },
  });
  if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status} for ${companyName}`);
  const html = await res.text();

  const redirectMatches = html.matchAll(/uddg=([^&"']+)/g);
  for (const m of redirectMatches) {
    const target = decodeURIComponent(m[1]);
    if (/linkedin\.com\/company\//i.test(target)) {
      let url = target.split("?")[0];
      if (!url.endsWith("/")) url += "/";
      return url;
    }
  }

  return extractLinkedInCompanyUrl(html);
}

async function loadLiveEmployers() {
  const jobs = JSON.parse(await readFile(jobsPath, "utf8"));
  const counts = new Map();
  for (const job of jobs.jobs) {
    counts.set(job.company, (counts.get(job.company) ?? 0) + 1);
  }
  return counts;
}

async function main() {
  const linkedin = JSON.parse(await readFile(linkedinPath, "utf8"));
  const liveCounts = await loadLiveEmployers();

  let targets = [];
  if (oneCompany) {
    targets = [oneCompany];
  } else if (tier === "p0") {
    targets = [...liveCounts.keys()].sort(
      (a, b) => (liveCounts.get(b) ?? 0) - (liveCounts.get(a) ?? 0),
    );
  } else {
    targets = Object.keys(linkedin.companies).sort();
  }

  const results = [];
  for (const name of targets) {
    const existing = linkedin.companies[name];
    if (existing?.linkedinUrl && existing.verified) {
      results.push({ name, status: "cached", url: existing.linkedinUrl });
      continue;
    }

    process.stdout.write(`Looking up ${name}… `);
    try {
      const url = await searchLinkedInUrl(name);
      if (url) {
        linkedin.companies[name] = {
          linkedinUrl: url,
          followStatus: existing?.followStatus ?? "pending",
          verified: false,
          notes: existing?.notes ?? "Auto-discovered via DuckDuckGo — verify before follow",
        };
        results.push({ name, status: "found", url });
        console.log(url);
      } else {
        results.push({ name, status: "not_found", url: null });
        console.log("not found");
      }
    } catch (err) {
      results.push({ name, status: "error", error: String(err) });
      console.log(`error: ${err.message}`);
    }
    await sleep(delayMs);
  }

  if (write) {
    await writeFile(linkedinPath, `${JSON.stringify(linkedin, null, 2)}\n`);
    console.log(`\nWrote ${linkedinPath}`);
  } else {
    console.log("\nDry run — pass --write to save discoveries.");
  }

  const summary = {
    total: results.length,
    cached: results.filter((r) => r.status === "cached").length,
    found: results.filter((r) => r.status === "found").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    errors: results.filter((r) => r.status === "error").length,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
