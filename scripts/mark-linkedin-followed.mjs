#!/usr/bin/env node
/**
 * Persist LinkedIn follow progress into data/companies.csv.
 *
 *   node scripts/mark-linkedin-followed.mjs --company="General Mills"
 *   node scripts/mark-linkedin-followed.mjs --session=1
 *   node scripts/mark-linkedin-followed.mjs --company="Amazon" --status=skipped
 *
 * Session numbers match the export checklist (pending-with-URL order, 10 per batch).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const companiesPath = path.join(root, "data/companies.csv");
const jobsPath = path.join(root, "data/packaging/jobs.json");

const args = process.argv.slice(2);
const companyArg = args.find((a) => a.startsWith("--company="))?.slice("--company=".length);
const sessionArg = args.find((a) => a.startsWith("--session="))?.slice("--session=".length);
const status =
  args.find((a) => a.startsWith("--status="))?.slice("--status=".length) ?? "followed";

if (!["followed", "skipped", "pending", "no_page"].includes(status)) {
  console.error("Invalid --status. Use followed | skipped | pending | no_page");
  process.exit(1);
}

if (!companyArg && !sessionArg) {
  console.error("Pass --company=Name and/or --session=1|2|3");
  process.exit(1);
}

function splitCsvLine(line) {
  const cols = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      cols.push(cur);
      cur = "";
    } else cur += ch;
  }
  cols.push(cur);
  return cols;
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsv(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
  });
  return { headers, rows };
}

async function main() {
  const { headers, rows } = parseCsv(await readFile(companiesPath, "utf8"));
  if (!headers.includes("linkedin_url") || !headers.includes("follow_status")) {
    console.error("companies.csv missing linkedin_url / follow_status columns");
    process.exit(1);
  }

  const jobs = JSON.parse(await readFile(jobsPath, "utf8"));
  const liveCounts = new Map();
  for (const job of jobs.jobs) {
    liveCounts.set(job.company, (liveCounts.get(job.company) ?? 0) + 1);
  }

  const pending = rows
    .filter(
      (r) =>
        (liveCounts.get(r.company) ?? 0) > 0 &&
        r.follow_status === "pending" &&
        r.linkedin_url,
    )
    .sort(
      (a, b) =>
        (liveCounts.get(b.company) ?? 0) - (liveCounts.get(a.company) ?? 0) ||
        a.company.localeCompare(b.company),
    );

  const targets = new Set();
  if (companyArg) targets.add(companyArg);
  if (sessionArg) {
    const session = Number(sessionArg);
    const start = (session - 1) * 10;
    const end = session * 10;
    for (const row of pending.slice(start, end)) targets.add(row.company);
  }

  let updated = 0;
  for (const row of rows) {
    if (!targets.has(row.company)) continue;
    row.follow_status = status;
    updated += 1;
    console.log(`${row.company} → ${status}`);
  }

  if (updated === 0) {
    console.error("No matching companies updated. Check --company / --session.");
    process.exit(1);
  }

  const out = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h] ?? "")).join(",")),
  ].join("\n");
  await writeFile(companiesPath, `${out}\n`);
  console.log(`Updated ${updated} row(s) in ${companiesPath}`);
  console.log("Re-run: npm run export:linkedin-employers");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
