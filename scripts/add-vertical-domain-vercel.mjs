#!/usr/bin/env node
/**
 * Add a vertical subdomain to the Vercel project (packaging-job-board).
 *
 * Requires:
 *   VERCEL_TOKEN — create at https://vercel.com/account/tokens
 *   VERCEL_TEAM_ID or VERCEL_TEAM_SLUG — optional; defaults slug to alba24
 *
 * Usage:
 *   node scripts/add-vertical-domain-vercel.mjs                              # dry run
 *   node scripts/add-vertical-domain-vercel.mjs --apply                      # add domain
 *   node scripts/add-vertical-domain-vercel.mjs --apply --domain foo.example.com
 *   node scripts/add-vertical-domain-vercel.mjs --apply --project my-project
 */
const API = "https://api.vercel.com";

const domain = process.argv.includes("--domain")
  ? process.argv[process.argv.indexOf("--domain") + 1]
  : "businesscontinuity.nicheboardjobs.com";

const project =
  process.argv.includes("--project")
    ? process.argv[process.argv.indexOf("--project") + 1]
    : "packaging-job-board";

const apply = process.argv.includes("--apply");

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  const slug = process.env.VERCEL_TEAM_SLUG ?? "alba24";
  if (teamId) return `teamId=${encodeURIComponent(teamId)}`;
  if (slug) return `slug=${encodeURIComponent(slug)}`;
  return "";
}

function authHeaders() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function requireAuth() {
  const headers = authHeaders();
  if (!headers) {
    console.error(
      "Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens",
    );
    process.exit(1);
  }
  return headers;
}

async function api(path, options = {}) {
  const team = teamQuery();
  const sep = path.includes("?") ? "&" : "?";
  const url = team ? `${API}${path}${sep}${team}` : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...requireAuth(), ...options.headers },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail =
      typeof body === "object" && body?.error?.message
        ? body.error.message
        : text || res.statusText;
    throw new Error(`${res.status} ${path}: ${detail}`);
  }
  return body;
}

async function listProjectDomains() {
  const domains = [];
  let until;
  for (;;) {
    const qs = new URLSearchParams({ limit: "100" });
    if (until) qs.set("until", String(until));
    const team = teamQuery();
    const suffix = team ? `&${team}` : "";
    const data = await api(
      `/v9/projects/${encodeURIComponent(project)}/domains?${qs}${suffix}`,
    );
    const batch = data.domains ?? [];
    domains.push(...batch);
    if (!data.pagination?.next || batch.length === 0) break;
    until = data.pagination.next;
  }
  return domains;
}

async function addProjectDomain(name) {
  return api(`/v10/projects/${encodeURIComponent(project)}/domains`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

async function main() {
  console.log(
    `${apply ? "Applying" : "Dry run — pass --apply to write"} add ${domain} to Vercel project "${project}"\n`,
  );

  if (!authHeaders()) {
    if (apply) {
      console.error(
        "Missing VERCEL_TOKEN — cannot apply. Create one at https://vercel.com/account/tokens",
      );
      process.exit(1);
    }
    console.log("No VERCEL_TOKEN — planned action only:\n");
    console.log(`○ POST /v10/projects/${project}/domains`);
    console.log(`  name: ${domain}`);
    console.log(
      "\nAdd VERCEL_TOKEN to your Cloud Agent environment, then run: npm run add:vertical-domain",
    );
    return;
  }

  const existing = await listProjectDomains();
  const match = existing.find((d) => d.name === domain);

  if (match) {
    console.log(`✓ ${domain} already on project (${match.verified ? "verified" : "pending verification"})`);
    console.log(JSON.stringify(match, null, 2));
    return;
  }

  console.log(`${apply ? "→" : "○"} Add ${domain} to project ${project}`);
  if (apply) {
    const created = await addProjectDomain(domain);
    console.log(`✓ Added ${domain}`);
    console.log(JSON.stringify(created, null, 2));
  } else {
    console.log("\nDry run complete. Re-run with --apply to add the domain.");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
