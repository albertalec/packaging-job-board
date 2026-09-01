import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const VERTICALS = {
  packaging: {
    id: "packaging",
    label: "Packaging",
    jobsPath: path.join(root, "data/packaging/jobs.json"),
    alertsUrl: "https://packaging.nicheboardjobs.com",
  },
  businesscontinuity: {
    id: "businesscontinuity",
    label: "Resilience",
    jobsPath: path.join(root, "data/businesscontinuity/jobs.json"),
    alertsUrl: "https://businesscontinuity.nicheboardjobs.com",
  },
};

export async function loadLinkedInRegistry(linkedinPath) {
  const raw = JSON.parse(await readFile(linkedinPath, "utf8"));
  if (raw.version >= 2 && raw.verticals) return raw;
  return {
    version: 2,
    description: raw.description,
    verticals: {
      packaging: { label: "Packaging", companies: raw.companies ?? {} },
      businesscontinuity: { label: "Resilience", companies: {} },
    },
  };
}

export function companiesForVertical(registry, verticalId) {
  return registry.verticals[verticalId]?.companies ?? {};
}

export async function loadLiveCounts(jobsPath) {
  const jobs = JSON.parse(await readFile(jobsPath, "utf8"));
  const counts = new Map();
  for (const job of jobs.jobs) {
    counts.set(job.company, (counts.get(job.company) ?? 0) + 1);
  }
  return counts;
}

export function resolveVerticalsArg(arg) {
  if (!arg || arg === "all") return Object.keys(VERTICALS);
  return arg.split(",").map((v) => v.trim()).filter(Boolean);
}
