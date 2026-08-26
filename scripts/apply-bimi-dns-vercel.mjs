#!/usr/bin/env node
/**
 * Apply BIMI-related DNS changes on Vercel for nicheboardjobs.com.
 *
 * Requires:
 *   VERCEL_TOKEN — create at https://vercel.com/account/tokens (DNS scope)
 *   VERCEL_TEAM_ID or VERCEL_TEAM_SLUG — optional; needed for team-owned domains
 *
 * Usage:
 *   node scripts/apply-bimi-dns-vercel.mjs              # dry run
 *   node scripts/apply-bimi-dns-vercel.mjs --apply      # create/update records
 *   node scripts/apply-bimi-dns-vercel.mjs --apply --domain example.com
 */
const API = "https://api.vercel.com";

const domain = process.argv.includes("--domain")
  ? process.argv[process.argv.indexOf("--domain") + 1]
  : "nicheboardjobs.com";

const apply = process.argv.includes("--apply");

const DMARC_NAME = "_dmarc";
const DMARC_VALUE =
  "v=DMARC1; p=quarantine; pct=100; rua=mailto:hello@nicheboardjobs.com";

const BIMI_NAME = "default._bimi";
const BIMI_VALUE =
  "v=BIMI1; l=https://nicheboardjobs.com/brand/bimi/logo.svg;";

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

async function listAllRecords() {
  const records = [];
  let since;
  for (;;) {
    const qs = new URLSearchParams({ limit: "100" });
    if (since) qs.set("since", String(since));
    const team = teamQuery();
    const suffix = team ? `&${team}` : "";
    const data = await api(`/v5/domains/${domain}/records?${qs}${suffix}`);
    const batch = data.records ?? [];
    records.push(...batch);
    if (!data.pagination?.next || batch.length === 0) break;
    since = data.pagination.next;
  }
  return records;
}

async function updateRecord(id, patch) {
  return api(`/v1/domains/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

async function createRecord(record) {
  return api(`/v2/domains/${domain}/records`, {
    method: "POST",
    body: JSON.stringify(record),
  });
}

function findTxt(records, name) {
  return records.filter((r) => r.type === "TXT" && r.name === name);
}

async function ensureTxt(name, value, comment) {
  const existing = findTxt(await listAllRecords(), name);
  const match = existing.find((r) => r.value === value);

  if (match) {
    console.log(`✓ ${name} already set (${match.id})`);
    return;
  }

  if (existing.length === 1) {
    const rec = existing[0];
    console.log(`${apply ? "→" : "○"} Update ${name} (${rec.id})`);
    console.log(`  from: ${rec.value}`);
    console.log(`    to: ${value}`);
    if (apply) {
      await updateRecord(rec.id, { value, comment });
      console.log(`✓ Updated ${name}`);
    }
    return;
  }

  if (existing.length > 1) {
    console.warn(
      `⚠ Multiple TXT records named ${name} (${existing.length}). Update manually in Vercel.`,
    );
    for (const rec of existing) console.warn(`  - ${rec.id}: ${rec.value}`);
    return;
  }

  console.log(`${apply ? "→" : "○"} Create ${name} TXT`);
  console.log(`  value: ${value}`);
  if (apply) {
    const created = await createRecord({
      type: "TXT",
      name,
      value,
      ttl: 60,
      comment,
    });
    console.log(`✓ Created ${name} (${created.uid ?? created.id ?? "ok"})`);
  }
}

async function main() {
  console.log(
    `${apply ? "Applying" : "Dry run — pass --apply to write"} BIMI DNS on ${domain}\n`,
  );

  if (!authHeaders()) {
    if (apply) {
      console.error(
        "Missing VERCEL_TOKEN — cannot apply. Create one at https://vercel.com/account/tokens",
      );
      process.exit(1);
    }
    console.log("No VERCEL_TOKEN — planned changes only:\n");
    console.log(`○ Update or create ${DMARC_NAME} TXT`);
    console.log(`  value: ${DMARC_VALUE}`);
    console.log(`○ Create ${BIMI_NAME} TXT`);
    console.log(`  value: ${BIMI_VALUE}`);
    console.log(
      "\nAdd VERCEL_TOKEN to your Cloud Agent environment, then run: npm run apply:bimi-dns",
    );
    return;
  }

  await ensureTxt(
    DMARC_NAME,
    DMARC_VALUE,
    "BIMI: enforced DMARC for alerts@ (p=quarantine, pct=100)",
  );
  await ensureTxt(
    BIMI_NAME,
    BIMI_VALUE,
    "BIMI logo URL for inbox sender avatar (alerts@)",
  );

  if (!apply) {
    console.log("\nDry run complete. Re-run with --apply to write changes.");
  } else {
    console.log("\nDone. Verify with: npm run check:bimi");
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
