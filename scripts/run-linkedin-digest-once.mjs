import { digestSummary, runLinkedInDraftDigest } from "../src/lib/social/digest.ts";

function argValue(flag) {
  const entry = process.argv.find((a) => a.startsWith(flag + "="));
  return entry ? entry.slice(flag.length + 1) : undefined;
}

const verticalId = argValue("--vertical") ?? "packaging";
const postType = argValue("--postType") ?? "current-events";

const result = await runLinkedInDraftDigest({ verticalId, postType });
const summary = digestSummary(result);

console.log(JSON.stringify({ summary, postType: result.postType, recipients: result.recipients, items: result.items }, null, 2));

process.exit(summary.emailed > 0 ? 0 : 1);
