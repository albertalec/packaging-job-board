/**
 * Runner for social:linkedin-draft — loads compiled TS via tsx.
 */
import { generateLinkedInPostDraft, socialConfigStatus } from "../src/lib/social/linkedin.ts";

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
