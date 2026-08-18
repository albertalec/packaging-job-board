import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { list, put } from "@vercel/blob";

export type Sponsorship = {
  jobId: string;
  sponsoredAt: string;
  expiresAt: string;
  stripeSessionId: string;
  payerEmail?: string | null;
};

type SponsorshipFile = {
  sponsorships: Sponsorship[];
};

const LOCAL_FILE = path.join(process.cwd(), "data", "sponsorships.json");
const BLOB_NAME = "sponsorships.json";

function readLocalFile(): SponsorshipFile {
  try {
    return JSON.parse(readFileSync(LOCAL_FILE, "utf8")) as SponsorshipFile;
  } catch {
    return { sponsorships: [] };
  }
}

function writeLocalFile(data: SponsorshipFile): void {
  writeFileSync(LOCAL_FILE, `${JSON.stringify(data, null, 2)}\n`);
}

async function readBlobFile(): Promise<SponsorshipFile> {
  const { blobs } = await list({ prefix: BLOB_NAME, limit: 1 });
  if (blobs.length === 0) return { sponsorships: [] };
  const response = await fetch(blobs[0].downloadUrl);
  if (!response.ok) return { sponsorships: [] };
  return (await response.json()) as SponsorshipFile;
}

async function writeBlobFile(data: SponsorshipFile): Promise<void> {
  await put(BLOB_NAME, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStore(): Promise<SponsorshipFile> {
  if (useBlobStore()) return readBlobFile();
  return readLocalFile();
}

async function writeStore(data: SponsorshipFile): Promise<void> {
  if (useBlobStore()) {
    await writeBlobFile(data);
    return;
  }
  writeLocalFile(data);
}

export function isActiveSponsorship(sponsorship: Sponsorship, now = Date.now()): boolean {
  return Date.parse(sponsorship.expiresAt) > now;
}

export async function loadSponsorships(): Promise<Sponsorship[]> {
  const { sponsorships } = await readStore();
  return sponsorships.filter((entry) => isActiveSponsorship(entry));
}

export async function getActiveSponsoredJobIds(): Promise<Set<string>> {
  const active = await loadSponsorships();
  return new Set(active.map((entry) => entry.jobId));
}

export async function addSponsorship(entry: Sponsorship): Promise<void> {
  const store = await readStore();
  const withoutJob = store.sponsorships.filter((item) => item.jobId !== entry.jobId);
  withoutJob.push(entry);
  await writeStore({ sponsorships: withoutJob });
}

export async function getSponsorshipForJob(jobId: string): Promise<Sponsorship | undefined> {
  const active = await loadSponsorships();
  return active.find((entry) => entry.jobId === jobId);
}
