/**
 * Runner for social:linkedin-draft — loads compiled TS via tsx.
 * Reads `.env.local` when present (same as Next.js local dev).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateLinkedInPostDraft, socialConfigStatus } from "../src/lib/social/linkedin.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const file = path.join(__dirname, "..", ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

function parseArgs(argv) {
  const options = {
    vertical: "packaging",
    postType: undefined,
    dryRun: false,
    recent: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--vertical=")) {
      options.vertical = arg.slice("--vertical=".length);
    } else if (arg.startsWith("--postType=")) {
      options.postType = arg.slice("--postType=".length);
    } else if (arg === "--dry-run" || arg === "--dryRun") {
      options.dryRun = true;
    } else if (arg === "--recent") {
      options.recent = true;
    }
  }

  if (process.env.SOCIAL_DRY_RUN === "true") {
    options.dryRun = true;
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const config = socialConfigStatus();

console.log("Social config:", config);
console.log(`Generating LinkedIn draft for ${options.vertical}…\n`);

const result = await generateLinkedInPostDraft({
  verticalId: options.vertical,
  postType: options.postType,
  dryRun: options.dryRun,
  includeRecent: options.recent,
});

if (result.draft) {
  console.log("--- LinkedIn draft ---\n");
  console.log(result.draft);
  console.log("\n--- end draft ---\n");
}

if (result.xTweets?.length) {
  console.log(`X context (${result.xQuery}): ${result.xTweets.length} tweet(s)`);
  for (const tweet of result.xTweets.slice(0, 3)) {
    console.log(`  • ${tweet.text.slice(0, 120)}…`);
  }
}

if (result.job) {
  console.log(`Job anchor: ${result.job.title} at ${result.job.company}`);
  console.log(`  ${result.job.url}`);
}

if (result.errors.length) {
  console.error("\nWarnings/errors:");
  for (const error of result.errors) console.error(`  • ${error}`);
}

if (!result.ok) {
  process.exit(result.skipped ? 0 : 1);
}

if (result.saved) {
  console.log(`\nSaved draft ${result.saved.id} (${result.dryRun ? "dry-run skipped save" : "persisted"})`);
}
