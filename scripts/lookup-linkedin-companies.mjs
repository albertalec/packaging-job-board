#!/usr/bin/env node
/**
 * Look up LinkedIn company page URLs via DuckDuckGo (does not scrape LinkedIn).
 *
 *   node scripts/lookup-linkedin-companies.mjs --vertical=businesscontinuity --tier=p0 --write
 *   node scripts/lookup-linkedin-companies.mjs --company="Capital One" --vertical=businesscontinuity --write
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VERTICALS,
  loadLinkedInRegistry,
  loadLiveCounts,
  resolveVerticalsArg,
} from "./linkedin-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linkedinPath = path.join(root, "data/linkedin-companies.json");

const args = process.argv.slice(2);
const tier = args.find((a) => a.startsWith("--tier="))?.split("=")[1] ?? "p0";
const verticalArg =
  args.find((a) => a.startsWith("--vertical="))?.split("=")[1] ?? "all";
const write = args.includes("--write");
const oneCompany = args.find((a) => a.startsWith("--company="))?.split("=")[1];
const delayMs = Number(
  args.find((a) => a.startsWith("--delay="))?.split("=")[1] ?? 1500,
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

async function targetsForVertical(registry, verticalId) {
  const liveCounts = await loadLiveCounts(VERTICALS[verticalId].jobsPath);
  const companies = registry.verticals[verticalId]?.companies ?? {};

  if (oneCompany) return [{ verticalId, name: oneCompany }];

  const names = new Set();
  if (tier === "p0") {
    for (const name of liveCounts.keys()) names.add(name);
  } else {
    for (const name of Object.keys(companies)) names.add(name);
  }

  return [...names].map((name) => ({ verticalId, name }));
}

async function main() {
  const registry = await loadLinkedInRegistry(linkedinPath);
  const verticalIds = resolveVerticalsArg(verticalArg);
  const results = [];

  for (const verticalId of verticalIds) {
    if (!VERTICALS[verticalId]) {
      console.error(`Unknown vertical: ${verticalId}`);
      process.exit(1);
    }

    const targets = await targetsForVertical(registry, verticalId);
    for (const { name } of targets) {
      const bucket = registry.verticals[verticalId].companies;
      const existing = bucket[name];
      if (existing?.linkedinUrl && existing.verified) {
        results.push({ verticalId, name, status: "cached", url: existing.linkedinUrl });
        continue;
      }

      process.stdout.write(`[${verticalId}] Looking up ${name}… `);
      try {
        const url = await searchLinkedInUrl(name);
        if (url) {
          bucket[name] = {
            linkedinUrl: url,
            followStatus: existing?.followStatus ?? "pending",
            verified: false,
            notes:
              existing?.notes ??
              "Auto-discovered via DuckDuckGo — verify before follow",
          };
          results.push({ verticalId, name, status: "found", url });
          console.log(url);
        } else {
          results.push({ verticalId, name, status: "not_found", url: null });
          console.log("not found");
        }
      } catch (err) {
        results.push({ verticalId, name, status: "error", error: String(err) });
        console.log(`error: ${err.message}`);
      }
      await sleep(delayMs);
    }
  }

  if (write) {
    await writeFile(linkedinPath, `${JSON.stringify(registry, null, 2)}\n`);
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
