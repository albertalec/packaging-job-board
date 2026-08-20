import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";

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
const LEGACY_BLOB_NAME = "sponsorships.json";

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

function readLocalFile(vertical: string): SponsorshipFile {
  const modern = sponsorshipLocalFile(vertical);
  try {
    return JSON.parse(readFileSync(modern, "utf8")) as SponsorshipFile;
  } catch {
    if (vertical === "packaging") {
      try {
        return JSON.parse(readFileSync(LEGACY_LOCAL_FILE, "utf8")) as SponsorshipFile;
      } catch {
        return { sponsorships: [] };
      }
    }
    return { sponsorships: [] };
  }
}

function writeLocalFile(vertical: string, data: SponsorshipFile): void {
  const file = sponsorshipLocalFile(vertical);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function readNamedBlob(name: string): Promise<SponsorshipFile | null> {
  const { blobs } = await list({ prefix: name, limit: 1 });
  if (blobs.length === 0) return null;
  const response = await fetch(blobs[0].downloadUrl);
  if (!response.ok) return null;
  return (await response.json()) as SponsorshipFile;
}

async function readBlobFile(vertical: string): Promise<SponsorshipFile> {
  const modern = await readNamedBlob(sponsorshipBlobName(vertical));
  if (modern) {
    return {
      sponsorships: modern.sponsorships.map((entry) =>
        withVertical(entry, vertical),
      ),
    };
  }
  if (vertical === "packaging") {
    const legacy = await readNamedBlob(LEGACY_BLOB_NAME);
    if (legacy) {
      return {
        sponsorships: legacy.sponsorships.map((entry) =>
          withVertical(entry, "packaging"),
        ),
      };
    }
  }
  return { sponsorships: [] };
}

async function writeBlobFile(vertical: string, data: SponsorshipFile): Promise<void> {
  await put(sponsorshipBlobName(vertical), JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStore(vertical: string): Promise<SponsorshipFile> {
  if (useBlobStore()) return readBlobFile(vertical);
  return readLocalFile(vertical);
}

async function writeStore(vertical: string, data: SponsorshipFile): Promise<void> {
  if (useBlobStore()) {
    await writeBlobFile(vertical, data);
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
