#!/usr/bin/env node
/**
 * Export ingest employers with LinkedIn URLs and generate a follow checklist.
 *
 *   node scripts/export-linkedin-employers.mjs
 *   node scripts/export-linkedin-employers.mjs --tier=p0
 *
 * Outputs:
 *   data/linkedin-employers-packaging.csv
 *   data/linkedin-follow-checklist.html
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const linkedinPath = path.join(root, "data/linkedin-companies.json");
const jobsPath = path.join(root, "data/packaging/jobs.json");
const csvPath = path.join(root, "data/linkedin-employers-packaging.csv");
const htmlPath = path.join(root, "data/linkedin-follow-checklist.html");

const tier = process.argv.find((a) => a.startsWith("--tier="))?.split("=")[1] ?? "p0";

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildRows(liveCounts, linkedinData) {
  const rows = [];
  for (const [name, meta] of Object.entries(linkedinData.companies)) {
    const liveJobCount = liveCounts.get(name) ?? 0;
    if (tier === "p0" && liveJobCount === 0) continue;
    rows.push({
      company: name,
      liveJobCount,
      linkedinUrl: meta.linkedinUrl ?? "",
      followStatus: meta.followStatus ?? "pending",
      verified: meta.verified ?? false,
      notes: meta.notes ?? "",
    });
  }

  for (const [name, count] of liveCounts) {
    if (linkedinData.companies[name]) continue;
    rows.push({
      company: name,
      liveJobCount: count,
      linkedinUrl: "",
      followStatus: "pending",
      verified: false,
      notes: "Missing from linkedin-companies.json — run lookup script",
    });
  }

  rows.sort((a, b) => b.liveJobCount - a.liveJobCount || a.company.localeCompare(b.company));
  return rows;
}

function renderHtml(rows) {
  const payload = JSON.stringify(rows);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Niche Board — LinkedIn employer follow checklist</title>
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
    header p { margin: 0; opacity: 0.85; max-width: 42rem; font-size: 0.95rem; }
    .stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      font-size: 0.85rem;
    }
    .stats span { background: rgba(255,255,255,0.1); padding: 0.25rem 0.6rem; border-radius: 3px; }
    main { max-width: 920px; margin: 0 auto; padding: 1rem 1.25rem 2rem; }
    .toolbar {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      align-items: center;
    }
    .toolbar label { font-size: 0.9rem; color: var(--slate); }
    .toolbar select, .toolbar button {
      font: inherit;
      padding: 0.45rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      background: #fff;
      cursor: pointer;
    }
    .toolbar button.primary { background: var(--teal); color: #fff; border-color: var(--teal); }
    ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; }
    li {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 0.85rem 1rem;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem 1rem;
      align-items: center;
    }
    li.done { opacity: 0.55; }
    li.skipped { opacity: 0.45; }
    li.missing-url { border-color: var(--amber); }
    .rank { font-variant-numeric: tabular-nums; color: var(--slate); font-size: 0.85rem; min-width: 1.5rem; }
    .meta h2 { margin: 0; font-size: 1rem; }
    .meta p { margin: 0.15rem 0 0; font-size: 0.82rem; color: var(--slate); }
    .badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.1rem 0.35rem;
      border-radius: 2px;
      background: var(--mist);
      color: var(--slate);
      margin-left: 0.35rem;
    }
    .badge.live { background: #dbeafe; color: #1e40af; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
    .actions a, .actions button {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.4rem 0.7rem;
      border-radius: 3px;
      text-decoration: none;
      border: 1px solid var(--teal);
      color: var(--teal);
      background: #fff;
      cursor: pointer;
    }
    .actions a.primary { background: var(--teal); color: #fff; }
    .actions button.ghost { border-color: #cbd5e1; color: var(--slate); }
    .hint {
      margin-top: 1.25rem;
      padding: 1rem;
      background: #fff;
      border-left: 3px solid var(--teal);
      font-size: 0.9rem;
      color: var(--slate);
    }
    @media (max-width: 640px) {
      li { grid-template-columns: 1fr; }
      .rank { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>LinkedIn employer follow checklist</h1>
    <p>
      Open each company page, click <strong>Follow</strong> while logged into LinkedIn,
      then mark done here. Work in batches of 10–15 per session to avoid rate limits.
      Progress is saved in this browser only.
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
      <button type="button" id="open-next-batch" class="primary">Open next batch (10)</button>
      <button type="button" id="reset-progress" class="ghost">Reset browser progress</button>
    </div>
    <ol id="list"></ol>
    <div class="hint">
      <strong>Tip:</strong> Following shows company posts in your feed. For new package-development roles,
      use <a href="https://packaging.nicheboardjobs.com">Packaging job alerts</a> — they are more precise than LinkedIn follows.
    </div>
  </main>
  <script>
    const STORAGE_KEY = "nicheboard-linkedin-follow-v1";
    const rows = ${payload};
    let progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    function saveProgress() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      renderStats();
    }

    function statusFor(company) {
      return progress[company] || rows.find(r => r.company === company)?.followStatus || "pending";
    }

    function renderStats() {
      const statuses = rows.map(r => statusFor(r.company));
      document.getElementById("stat-total").textContent = rows.length + " employers";
      document.getElementById("stat-pending").textContent =
        statuses.filter(s => s === "pending").length + " pending";
      document.getElementById("stat-done").textContent =
        statuses.filter(s => s === "followed").length + " followed";
    }

    function renderList() {
      const filter = document.getElementById("filter").value;
      const list = document.getElementById("list");
      list.innerHTML = "";
      rows.forEach((row, i) => {
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
          open.dataset.company = row.company;
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

    document.getElementById("filter").addEventListener("change", renderList);
    document.getElementById("open-next-batch").addEventListener("click", () => {
      const pending = rows.filter(r => statusFor(r.company) === "pending" && r.linkedinUrl);
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
  const linkedinData = JSON.parse(await readFile(linkedinPath, "utf8"));
  const jobs = JSON.parse(await readFile(jobsPath, "utf8"));
  const liveCounts = new Map();
  for (const job of jobs.jobs) {
    liveCounts.set(job.company, (liveCounts.get(job.company) ?? 0) + 1);
  }

  const rows = buildRows(liveCounts, linkedinData);

  const header = "company,live_job_count,linkedin_url,follow_status,verified,notes";
  const csv = [
    header,
    ...rows.map((r) =>
      [
        csvEscape(r.company),
        r.liveJobCount,
        csvEscape(r.linkedinUrl),
        csvEscape(r.followStatus),
        r.verified,
        csvEscape(r.notes),
      ].join(","),
    ),
  ].join("\n");

  await writeFile(csvPath, `${csv}\n`);
  await writeFile(htmlPath, renderHtml(rows));

  console.log(`Wrote ${csvPath} (${rows.length} rows, tier=${tier})`);
  console.log(`Wrote ${htmlPath}`);
  console.log("\nOpen the checklist:");
  console.log(`  xdg-open ${htmlPath}`);
  console.log("  or: npx serve data  →  http://localhost:3000/linkedin-follow-checklist.html");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
