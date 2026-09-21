#!/usr/bin/env node
/**
 * Export Packaging ingest employers with LinkedIn URLs and a follow checklist.
 *
 * Source of truth: data/companies.csv (linkedin_url, follow_status)
 * Live signal: data/packaging/jobs.json
 *
 *   node scripts/export-linkedin-employers.mjs
 *   node scripts/export-linkedin-employers.mjs --tier=p0
 *   node scripts/export-linkedin-employers.mjs --tier=p1
 *   node scripts/export-linkedin-employers.mjs --tier=all
 *
 * Outputs:
 *   data/linkedin-employers-packaging.csv
 *   data/linkedin-follow-checklist.html
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const companiesPath = path.join(root, "data/companies.csv");
const jobsPath = path.join(root, "data/packaging/jobs.json");
const csvPath = path.join(root, "data/linkedin-employers-packaging.csv");
const htmlPath = path.join(root, "data/linkedin-follow-checklist.html");

const tier = process.argv.find((a) => a.startsWith("--tier="))?.split("=")[1] ?? "p0";

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsv(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
  });
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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function assignSession(index) {
  if (index < 10) return 1;
  if (index < 20) return 2;
  return 3;
}

function buildRows(companies, liveCounts) {
  const rows = [];
  const seen = new Set();

  for (const row of companies) {
    const liveJobCount = liveCounts.get(row.company) ?? 0;
    const confidence = row.confidence || "";
    const isP0 = liveJobCount > 0;
    const isP1 = confidence === "high";
    if (tier === "p0" && !isP0) continue;
    if (tier === "p1" && !(isP0 || isP1)) continue;

    seen.add(row.company);
    rows.push({
      company: row.company,
      slug: slugify(row.company),
      careerUrl: row.career_url || "",
      liveJobCount,
      confidence,
      linkedinUrl: row.linkedin_url || "",
      followStatus: row.follow_status || "pending",
      notes: row.notes || "",
    });
  }

  for (const [name, count] of liveCounts) {
    if (seen.has(name)) continue;
    if (tier !== "p0" && tier !== "all" && tier !== "p1") continue;
    rows.push({
      company: name,
      slug: slugify(name),
      careerUrl: "",
      liveJobCount: count,
      confidence: "",
      linkedinUrl: "",
      followStatus: "pending",
      notes: "Missing from companies.csv — add linkedin_url",
    });
  }

  rows.sort(
    (a, b) =>
      b.liveJobCount - a.liveJobCount || a.company.localeCompare(b.company),
  );

  const pending = rows.filter(
    (r) => r.followStatus === "pending" && r.linkedinUrl,
  );
  const sessionByCompany = new Map();
  pending.forEach((r, i) => sessionByCompany.set(r.company, assignSession(i)));

  return rows.map((r) => ({
    ...r,
    followSession: sessionByCompany.get(r.company) ?? "",
  }));
}

function renderHtml(rows) {
  const payload = JSON.stringify(rows);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Niche Board — Packaging LinkedIn follow checklist</title>
  <style>
    :root {
      --navy: #0d1b2a;
      --teal: #0d7d77;
      --mist: #f1f3f5;
      --slate: #4b5563;
      --amber: #f5a623;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: var(--mist);
      color: var(--navy);
      line-height: 1.5;
    }
    header {
      background: var(--navy);
      color: #fff;
      padding: 1.5rem 1.25rem;
    }
    header h1 { margin: 0 0 0.35rem; font-size: 1.35rem; }
    header p { margin: 0; opacity: 0.85; max-width: 44rem; font-size: 0.95rem; }
    .stats {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; font-size: 0.85rem;
    }
    .stats span {
      background: rgba(255,255,255,0.1); padding: 0.25rem 0.6rem; border-radius: 3px;
    }
    main { max-width: 920px; margin: 0 auto; padding: 1rem 1.25rem 2rem; }
    .toolbar {
      display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center;
    }
    .toolbar label { font-size: 0.9rem; color: var(--slate); }
    .toolbar select, .toolbar button {
      font: inherit; padding: 0.45rem 0.75rem; border: 1px solid #cbd5e1;
      border-radius: 3px; background: #fff; cursor: pointer;
    }
    .toolbar button.primary { background: var(--teal); color: #fff; border-color: var(--teal); }
    ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; }
    li {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 3px;
      padding: 0.85rem 1rem; display: grid; grid-template-columns: auto 1fr auto;
      gap: 0.75rem 1rem; align-items: center;
    }
    li.done { opacity: 0.55; }
    li.skipped { opacity: 0.45; }
    li.missing-url { border-color: var(--amber); }
    .rank { font-variant-numeric: tabular-nums; color: var(--slate); font-size: 0.85rem; min-width: 1.5rem; }
    .meta h2 { margin: 0; font-size: 1rem; }
    .meta p { margin: 0.15rem 0 0; font-size: 0.82rem; color: var(--slate); }
    .badge {
      display: inline-block; font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.04em; padding: 0.1rem 0.35rem; border-radius: 2px;
      background: var(--mist); color: var(--slate); margin-left: 0.35rem;
    }
    .badge.live { background: #dbeafe; color: #1e40af; }
    .badge.session { background: #d1fae5; color: #065f46; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
    .actions a, .actions button {
      font: inherit; font-size: 0.85rem; padding: 0.4rem 0.7rem; border-radius: 3px;
      text-decoration: none; border: 1px solid var(--teal); color: var(--teal);
      background: #fff; cursor: pointer;
    }
    .actions a.primary { background: var(--teal); color: #fff; }
    .actions button.ghost { border-color: #cbd5e1; color: var(--slate); }
    .hint {
      margin-top: 1.25rem; padding: 1rem; background: #fff;
      border-left: 3px solid var(--teal); font-size: 0.9rem; color: var(--slate);
    }
    code { font-size: 0.85em; }
    @media (max-width: 640px) {
      li { grid-template-columns: 1fr; }
      .rank { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Packaging — LinkedIn employer follow checklist</h1>
    <p>
      Manual follows only (LinkedIn ToS). Batches of 10 per session over 3 days.
      Progress in this browser is local; persist with
      <code>npm run mark:linkedin-followed -- --company="Name"</code>.
    </p>
    <div class="stats">
      <span id="stat-total">— employers</span>
      <span id="stat-pending">— pending</span>
      <span id="stat-done">— followed</span>
    </div>
  </header>
  <main>
    <div class="toolbar">
      <label>
        Show
        <select id="filter">
          <option value="pending">Pending only</option>
          <option value="all">All</option>
          <option value="done">Followed</option>
          <option value="skipped">Skipped</option>
        </select>
      </label>
      <label>
        Session
        <select id="session-filter">
          <option value="all">All sessions</option>
          <option value="1">Session 1 (first 10)</option>
          <option value="2">Session 2 (next 10)</option>
          <option value="3">Session 3 (remainder)</option>
        </select>
      </label>
      <button type="button" id="open-next-batch" class="primary">Open next batch (10)</button>
      <button type="button" id="reset-progress" class="ghost">Reset browser progress</button>
    </div>
    <ol id="list"></ol>
    <div class="hint">
      After each session, update <code>data/companies.csv</code>:
      <code>npm run mark:linkedin-followed -- --session=1</code>
      then re-run <code>npm run export:linkedin-employers</code>.
      Alerts beat follows for role discovery —
      <a href="https://packaging.nicheboardjobs.com">Packaging job alerts</a>.
    </div>
  </main>
  <script>
    const STORAGE_KEY = "nicheboard-linkedin-follow-packaging-v1";
    const rows = ${payload};
    let progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    function saveProgress() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      renderStats();
    }

    function statusFor(company) {
      return progress[company] || rows.find(r => r.company === company)?.followStatus || "pending";
    }

    function visibleRows() {
      const session = document.getElementById("session-filter").value;
      if (session === "all") return rows;
      return rows.filter(r => String(r.followSession) === session);
    }

    function renderStats() {
      const visible = visibleRows();
      const statuses = visible.map(r => statusFor(r.company));
      document.getElementById("stat-total").textContent = visible.length + " employers";
      document.getElementById("stat-pending").textContent =
        statuses.filter(s => s === "pending").length + " pending";
      document.getElementById("stat-done").textContent =
        statuses.filter(s => s === "followed").length + " followed";
    }

    function renderList() {
      const filter = document.getElementById("filter").value;
      const list = document.getElementById("list");
      list.innerHTML = "";
      visibleRows().forEach((row, i) => {
        const status = statusFor(row.company);
        if (filter === "pending" && status !== "pending") return;
        if (filter === "done" && status !== "followed") return;
        if (filter === "skipped" && status !== "skipped") return;

        const li = document.createElement("li");
        li.className = status === "followed" ? "done" : status === "skipped" ? "skipped" : "";
        if (!row.linkedinUrl) li.classList.add("missing-url");

        const rank = document.createElement("div");
        rank.className = "rank";
        rank.textContent = String(i + 1);

        const meta = document.createElement("div");
        meta.className = "meta";
        const title = document.createElement("h2");
        title.textContent = row.company;
        if (row.followSession) {
          const s = document.createElement("span");
          s.className = "badge session";
          s.textContent = "Session " + row.followSession;
          title.appendChild(s);
        }
        if (row.liveJobCount > 0) {
          const b = document.createElement("span");
          b.className = "badge live";
          b.textContent = row.liveJobCount + " live role" + (row.liveJobCount === 1 ? "" : "s");
          title.appendChild(b);
        }
        meta.appendChild(title);
        if (row.notes) {
          const note = document.createElement("p");
          note.textContent = row.notes;
          meta.appendChild(note);
        }

        const actions = document.createElement("div");
        actions.className = "actions";
        if (row.linkedinUrl) {
          const open = document.createElement("a");
          open.href = row.linkedinUrl;
          open.target = "_blank";
          open.rel = "noopener noreferrer";
          open.className = "primary";
          open.textContent = "Open LinkedIn";
          actions.appendChild(open);
        }
        const done = document.createElement("button");
        done.type = "button";
        done.className = "ghost";
        done.textContent = status === "followed" ? "Undo" : "Mark followed";
        done.addEventListener("click", () => {
          progress[row.company] = status === "followed" ? "pending" : "followed";
          saveProgress();
          renderList();
        });
        actions.appendChild(done);
        const skip = document.createElement("button");
        skip.type = "button";
        skip.className = "ghost";
        skip.textContent = status === "skipped" ? "Unskip" : "Skip";
        skip.addEventListener("click", () => {
          progress[row.company] = status === "skipped" ? "pending" : "skipped";
          saveProgress();
          renderList();
        });
        actions.appendChild(skip);

        li.append(rank, meta, actions);
        list.appendChild(li);
      });
    }

    document.getElementById("filter").addEventListener("change", () => { renderStats(); renderList(); });
    document.getElementById("session-filter").addEventListener("change", () => { renderStats(); renderList(); });
    document.getElementById("open-next-batch").addEventListener("click", () => {
      const pending = visibleRows().filter(r => statusFor(r.company) === "pending" && r.linkedinUrl);
      pending.slice(0, 10).forEach(r => window.open(r.linkedinUrl, "_blank", "noopener,noreferrer"));
    });
    document.getElementById("reset-progress").addEventListener("click", () => {
      if (confirm("Clear follow progress saved in this browser?")) {
        progress = {};
        localStorage.removeItem(STORAGE_KEY);
        renderStats();
        renderList();
      }
    });

    renderStats();
    renderList();
  </script>
</body>
</html>`;
}

async function main() {
  const companies = parseCsv(await readFile(companiesPath, "utf8"));
  const jobs = JSON.parse(await readFile(jobsPath, "utf8"));
  const liveCounts = new Map();
  for (const job of jobs.jobs) {
    liveCounts.set(job.company, (liveCounts.get(job.company) ?? 0) + 1);
  }

  const rows = buildRows(companies, liveCounts);
  const header =
    "company,slug,career_url,live_job_count,confidence,linkedin_url,follow_status,follow_session,notes";
  const csv = [
    header,
    ...rows.map((r) =>
      [
        csvEscape(r.company),
        csvEscape(r.slug),
        csvEscape(r.careerUrl),
        r.liveJobCount,
        csvEscape(r.confidence),
        csvEscape(r.linkedinUrl),
        csvEscape(r.followStatus),
        r.followSession,
        csvEscape(r.notes),
      ].join(","),
    ),
  ].join("\n");

  await writeFile(csvPath, `${csv}\n`);
  await writeFile(htmlPath, renderHtml(rows));

  const pending = rows.filter((r) => r.followStatus === "pending" && r.linkedinUrl);
  const sessions = { 1: 0, 2: 0, 3: 0 };
  for (const r of pending) sessions[r.followSession] = (sessions[r.followSession] || 0) + 1;

  console.log(`Wrote ${csvPath} (${rows.length} rows, tier=${tier})`);
  console.log(`Wrote ${htmlPath}`);
  console.log(
    `Pending with URL: ${pending.length} → session1=${sessions[1]}, session2=${sessions[2]}, session3=${sessions[3]}`,
  );
  console.log("\nOpen checklist:");
  console.log("  start data\\linkedin-follow-checklist.html   (Windows)");
  console.log("  open data/linkedin-follow-checklist.html     (Mac)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
