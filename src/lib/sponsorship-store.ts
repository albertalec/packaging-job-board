import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  kvGetJson,
  kvSetJson,
  redisConfigured,
  sponsorshipRedisKey,
} from "./kv";

export type Sponsorship = {
  jobId: string;
  vertical: string;
  sponsoredAt: string;
  expiresAt: string;
  stripeSessionId: string;
  payerEmail?: string | null;
  host?: string | null;
  tier?: string;
};

type SponsorshipFile = {
  sponsorships: Sponsorship[];
};

const LEGACY_LOCAL_FILE = path.join(process.cwd(), "data", "sponsorships.json");

/** @deprecated Blob path name — kept for tests/docs only. */
export function sponsorshipBlobName(vertical: string): string {
  return `sponsorships/${vertical}.json`;
}

export function sponsorshipLocalFile(vertical: string): string {
  return path.join(process.cwd(), "data", "sponsorships", `${vertical}.json`);
}

function withVertical(entry: Sponsorship, vertical: string): Sponsorship {
  return {
    ...entry,
    vertical: entry.vertical || vertical,
    tier: entry.tier ?? "sponsor",
  };
}

function emptyStore(): SponsorshipFile {
  return { sponsorships: [] };
}

function readLocalFile(vertical: string): SponsorshipFile {
  const modern = sponsorshipLocalFile(vertical);
  try {
    return JSON.parse(readFileSync(modern, "utf8")) as SponsorshipFile;
  } catch {
    if (vertical === "packaging") {
      try {
        return JSON.parse(readFileSync(LEGACY_LOCAL_FILE, "utf8")) as SponsorshipFile;
      } catch {
        return emptyStore();
      }
    }
    return emptyStore();
  }
}

function writeLocalFile(vertical: string, data: SponsorshipFile): void {
  const file = sponsorshipLocalFile(vertical);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function readRedisFile(vertical: string): Promise<SponsorshipFile> {
  const stored = await kvGetJson<SponsorshipFile>(sponsorshipRedisKey(vertical));
  if (!stored) return emptyStore();
  return {
    sponsorships: (stored.sponsorships ?? []).map((entry) =>
      withVertical(entry, vertical),
    ),
  };
}

async function writeRedisFile(vertical: string, data: SponsorshipFile): Promise<void> {
  await kvSetJson(sponsorshipRedisKey(vertical), data);
  // Invalidate short-lived cache after writes.
  cache.delete(vertical);
}

/** Short in-memory cache so homepage reads don't hammer Redis on every request. */
const cache = new Map<string, { expiresAt: number; data: SponsorshipFile }>();
const CACHE_TTL_MS = 30_000;

async function readStore(vertical: string): Promise<SponsorshipFile> {
  if (redisConfigured()) {
    const hit = cache.get(vertical);
    if (hit && hit.expiresAt > Date.now()) return hit.data;
    const data = await readRedisFile(vertical);
    cache.set(vertical, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }
  return readLocalFile(vertical);
}

async function writeStore(vertical: string, data: SponsorshipFile): Promise<void> {
  if (redisConfigured()) {
    await writeRedisFile(vertical, data);
    return;
  }
  writeLocalFile(vertical, data);
}

export function isActiveSponsorship(sponsorship: Sponsorship, now = Date.now()): boolean {
  return Date.parse(sponsorship.expiresAt) > now;
}

export async function loadSponsorships(vertical: string): Promise<Sponsorship[]> {
  const { sponsorships } = await readStore(vertical);
  return sponsorships
    .map((entry) => withVertical(entry, vertical))
    .filter((entry) => entry.vertical === vertical && isActiveSponsorship(entry));
}

export async function getActiveSponsoredJobIds(vertical: string): Promise<Set<string>> {
  const active = await loadSponsorships(vertical);
  return new Set(active.map((entry) => entry.jobId));
}

export async function addSponsorship(entry: Sponsorship): Promise<void> {
  const vertical = entry.vertical;
  if (!vertical) {
    throw new Error("Sponsorship is missing a vertical");
  }
  const store = await readStore(vertical);
  const normalized = withVertical(entry, vertical);
  const withoutJob = store.sponsorships.filter(
    (item) => !(item.jobId === normalized.jobId && (item.vertical || vertical) === vertical),
  );
  withoutJob.push(normalized);
  await writeStore(vertical, { sponsorships: withoutJob });
}

export async function getSponsorshipForJob(
  jobId: string,
  vertical: string,
): Promise<Sponsorship | undefined> {
  const active = await loadSponsorships(vertical);
  return active.find((entry) => entry.jobId === jobId);
}
