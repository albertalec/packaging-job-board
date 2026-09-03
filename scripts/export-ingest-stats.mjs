#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

const PACKAGING_DROP_LABELS = {
  "warehouse/ops title": "Plant & warehouse ops",
  "semiconductor/electronics packaging": "Semiconductor packaging",
  "electronics/mechanical packaging": "Electronics packaging",
  "software/electronics packaging": "Software packaging",
  "off-target function": "Procurement & sales",
  "plant process engineering": "Plant process engineering",
  "packaging as commodity/category scope": "Packaging as category scope",
  "not a packaging role": "Not a packaging role",
};

const BCM_DROP_LABELS = {
  "field/FEMA disaster response": "Field / FEMA emergency ops",
  "product/SRE resilience noise": "Product / SRE resilience noise",
  "generic IT title": "Generic IT titles",
  "BCP acronym (business cards/payments)": "BCP acronym collisions",
  "manufacturing capacity resiliency": "Manufacturing capacity resiliency",
  "not a BCM/IT DR role": "Not BCM / IT DR",
};

function labelFor(reason, vertical) {
  const map =
    vertical === "businesscontinuity" ? BCM_DROP_LABELS : PACKAGING_DROP_LABELS;
  return map[reason] ?? reason;
}

function topReasons(classifierDrops, totalDrops, limit = 10) {
  return Object.entries(classifierDrops ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reason, count]) => ({
      reason,
      count,
      pct: totalDrops ? Math.round((count / totalDrops) * 1000) / 10 : 0,
    }));
}

async function loadJobsPayload(vertical) {
  const filePath = path.join(process.cwd(), "data", vertical, "jobs.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function loadSnapshotDelta(vertical) {
  try {
    const filePath = path.join(process.cwd(), "data", vertical, "snapshots.json");
    const raw = await readFile(filePath, "utf8");
    const history = JSON.parse(raw);
    const latest = history.snapshots?.[0];
    if (!latest) return null;
    return {
      ingestedAt: latest.ingestedAt,
      added: latest.newJobIds?.length ?? 0,
      removed: latest.removedJobIds?.length ?? 0,
      listed: latest.listed,
    };
  } catch {
    return null;
  }
}

function printVertical(vertical, payload) {
  const stats = payload.stats ?? {};
  const scanned = stats.scanned ?? 0;
  const classifierPass = stats.classifierPass ?? 0;
  const kept = stats.kept ?? payload.total ?? 0;
  const totalDrops = scanned - classifierPass;

  console.log(`\n=== ${vertical} ===`);
  console.log(`Ingested: ${payload.ingestedAt ?? "unknown"}`);
  console.log(`Scanned: ${scanned} → classifier pass: ${classifierPass} → listed: ${kept}`);

  const reasons = topReasons(stats.classifierDrops, totalDrops).map((item) => ({
    ...item,
    label: labelFor(item.reason, vertical),
  }));
  if (reasons.length) {
    console.log("Top classifier drops:");
    for (const item of reasons) {
      console.log(`  - ${item.label}: ${item.count} (${item.pct}%)`);
    }
  }

  return {
    vertical,
    ingestedAt: payload.ingestedAt,
    scanned,
    classifierPass,
    kept,
    classifierDrops: stats.classifierDrops ?? {},
    topClassifierDrops: reasons,
  };
}

async function main() {
  const verticals = process.argv.slice(2);
  const targets =
    verticals.length > 0 ? verticals : ["packaging", "businesscontinuity"];
  const exportPayload = { generatedAt: new Date().toISOString(), verticals: {} };

  for (const vertical of targets) {
    const payload = await loadJobsPayload(vertical);
    exportPayload.verticals[vertical] = {
      ...printVertical(vertical, payload),
      weeklyDelta: await loadSnapshotDelta(vertical),
    };
    const delta = exportPayload.verticals[vertical].weeklyDelta;
    if (delta) {
      console.log(
        `Weekly delta: +${delta.added} new · -${delta.removed} removed · ${delta.listed} listed`,
      );
    }
  }

  console.log("\n--- JSON ---");
  console.log(JSON.stringify(exportPayload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
