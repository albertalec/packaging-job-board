import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Niche } from "../../ingest/types";
import { alertsRedisKey, kvGetJson, kvSetJson, redisConfigured } from "./kv";

export type AlertSubscriber = {
  email: string;
  token: string;
  vertical: string;
  status: "pending" | "active";
  createdAt: string;
  confirmedAt?: string;
  niche?: Niche | null;
  state?: string | null;
  /** Job ids already included in a digest for this subscriber. */
  notifiedJobIds: string[];
};

type AlertsFile = {
  subscribers: AlertSubscriber[];
};

/** @deprecated Blob path name — kept for tests/docs only. */
export function alertsBlobName(vertical: string): string {
  return `alerts/${vertical}.json`;
}

export function alertsLocalFile(vertical: string): string {
  return path.join(process.cwd(), "data", "alerts", `${vertical}.json`);
}

function emptyStore(): AlertsFile {
  return { subscribers: [] };
}

function readLocalFile(vertical: string): AlertsFile {
  try {
    return JSON.parse(readFileSync(alertsLocalFile(vertical), "utf8")) as AlertsFile;
  } catch {
    return emptyStore();
  }
}

function writeLocalFile(vertical: string, data: AlertsFile): void {
  const file = alertsLocalFile(vertical);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function readRedisFile(vertical: string): Promise<AlertsFile> {
  const stored = await kvGetJson<AlertsFile>(alertsRedisKey(vertical));
  if (!stored) return emptyStore();
  return { subscribers: stored.subscribers ?? [] };
}

async function writeRedisFile(vertical: string, data: AlertsFile): Promise<void> {
  await kvSetJson(alertsRedisKey(vertical), data);
}

async function readStore(vertical: string): Promise<AlertsFile> {
  if (redisConfigured()) return readRedisFile(vertical);
  return readLocalFile(vertical);
}

async function writeStore(vertical: string, data: AlertsFile): Promise<void> {
  if (redisConfigured()) {
    await writeRedisFile(vertical, data);
    return;
  }
  writeLocalFile(vertical, data);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export async function loadAlertSubscribers(vertical: string): Promise<AlertSubscriber[]> {
  const { subscribers } = await readStore(vertical);
  return subscribers.filter((entry) => entry.vertical === vertical);
}

export async function findSubscriberByEmail(
  vertical: string,
  email: string,
): Promise<AlertSubscriber | undefined> {
  const needle = normalizeEmail(email);
  const subscribers = await loadAlertSubscribers(vertical);
  return subscribers.find((entry) => entry.email === needle);
}

export async function findSubscriberByToken(
  vertical: string,
  token: string,
): Promise<AlertSubscriber | undefined> {
  if (!token) return undefined;
  const subscribers = await loadAlertSubscribers(vertical);
  return subscribers.find((entry) => entry.token === token);
}

export async function upsertPendingSubscriber(input: {
  vertical: string;
  email: string;
  token: string;
  niche?: Niche | null;
  state?: string | null;
}): Promise<AlertSubscriber> {
  const email = normalizeEmail(input.email);
  const store = await readStore(input.vertical);
  const existing = store.subscribers.find(
    (entry) => entry.email === email && entry.vertical === input.vertical,
  );

  if (existing?.status === "active") {
    return existing;
  }

  const next: AlertSubscriber = {
    email,
    token: input.token,
    vertical: input.vertical,
    status: "pending",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    niche: input.niche ?? null,
    state: input.state ?? null,
    notifiedJobIds: existing?.notifiedJobIds ?? [],
  };

  const others = store.subscribers.filter(
    (entry) => !(entry.email === email && entry.vertical === input.vertical),
  );
  others.push(next);
  await writeStore(input.vertical, { subscribers: others });
  return next;
}

export async function confirmSubscriber(
  vertical: string,
  token: string,
): Promise<AlertSubscriber | null> {
  const store = await readStore(vertical);
  const index = store.subscribers.findIndex(
    (entry) => entry.token === token && entry.vertical === vertical,
  );
  if (index < 0) return null;

  const current = store.subscribers[index];
  const confirmed: AlertSubscriber = {
    ...current,
    status: "active",
    confirmedAt: current.confirmedAt ?? new Date().toISOString(),
  };
  store.subscribers[index] = confirmed;
  await writeStore(vertical, store);
  return confirmed;
}

export async function removeSubscriber(
  vertical: string,
  token: string,
): Promise<AlertSubscriber | null> {
  const store = await readStore(vertical);
  const existing = store.subscribers.find(
    (entry) => entry.token === token && entry.vertical === vertical,
  );
  if (!existing) return null;
  await writeStore(vertical, {
    subscribers: store.subscribers.filter(
      (entry) => !(entry.token === token && entry.vertical === vertical),
    ),
  });
  return existing;
}

export async function markJobsNotified(
  vertical: string,
  token: string,
  jobIds: string[],
): Promise<void> {
  if (jobIds.length === 0) return;
  const store = await readStore(vertical);
  const index = store.subscribers.findIndex(
    (entry) => entry.token === token && entry.vertical === vertical,
  );
  if (index < 0) return;

  const current = store.subscribers[index];
  const merged = new Set([...current.notifiedJobIds, ...jobIds]);
  const notifiedJobIds = [...merged].slice(-500);
  store.subscribers[index] = { ...current, notifiedJobIds };
  await writeStore(vertical, store);
}

export async function listActiveSubscribers(
  vertical: string,
): Promise<AlertSubscriber[]> {
  const subscribers = await loadAlertSubscribers(vertical);
  return subscribers.filter((entry) => entry.status === "active");
}
