#!/usr/bin/env node
/**
 * Push Grok + X env vars to Vercel from the current shell environment.
 *
 * Usage (values must already be exported or in .env.local):
 *   export XAI_API_KEY=...
 *   export X_BEARER_TOKEN=...
 *   node scripts/add-social-env-vercel.mjs --apply
 *
 * Optional:
 *   GROK_MODEL=grok-3 (default)
 *   SOCIAL_DRY_RUN=true (local only; omit on production)
 */
import { spawnSync } from "node:child_process";

const APPLY = process.argv.includes("--apply");
const TOKEN = process.env.VERCEL_TOKEN?.trim();

const SECRETS = [
  { name: "XAI_API_KEY", required: true },
  { name: "X_BEARER_TOKEN", required: true },
];

const CONFIG = [{ name: "GROK_MODEL", defaultValue: "grok-3" }];

function addEnv(name, value, target) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, target, "--force", "--token", TOKEN],
    { input: `${value}\n`, encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    return false;
  }
  console.log(`✓ ${name} → ${target}`);
  return true;
}

if (!TOKEN) {
  console.error("VERCEL_TOKEN is required.");
  process.exit(1);
}

const missing = SECRETS.filter((entry) => !process.env[entry.name]?.trim()).map(
  (entry) => entry.name,
);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

if (!APPLY) {
  console.log("Dry run — would set on Vercel production + preview:");
  for (const entry of SECRETS) console.log(`  ${entry.name}=***`);
  for (const entry of CONFIG) {
    const value = process.env[entry.name]?.trim() || entry.defaultValue;
    console.log(`  ${entry.name}=${value}`);
  }
  console.log("\nRe-run with --apply to write.");
  process.exit(0);
}

let ok = true;
for (const target of ["production", "preview"]) {
  for (const entry of SECRETS) {
    ok =
      addEnv(entry.name, process.env[entry.name].trim(), target) && ok;
  }
  for (const entry of CONFIG) {
    const value = process.env[entry.name]?.trim() || entry.defaultValue;
    ok = addEnv(entry.name, value, target) && ok;
  }
}

process.exit(ok ? 0 : 1);
