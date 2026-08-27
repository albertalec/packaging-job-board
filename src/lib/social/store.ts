import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { kvGetJson, kvSetJson, redisConfigured } from "../kv";

export type SocialDraftRecord = {
  id: string;
  vertical: string;
  postType: string;
  draft: string;
  createdAt: string;
  xTweetIds: string[];
  jobId?: string;
};

type SocialStoreFile = {
  drafts: SocialDraftRecord[];
  usedXTweetIds: string[];
  usedJobIds: string[];
};

function socialRedisKey(vertical: string): string {
  return `nicheboard:social:${vertical}`;
}

export function socialLocalFile(vertical: string): string {
  return path.join(process.cwd(), "data", "social", `${vertical}.json`);
}

function emptyStore(): SocialStoreFile {
  return { drafts: [], usedXTweetIds: [], usedJobIds: [] };
}

function readLocalFile(vertical: string): SocialStoreFile {
  try {
    return JSON.parse(
      readFileSync(socialLocalFile(vertical), "utf8"),
    ) as SocialStoreFile;
  } catch {
    return emptyStore();
  }
}

function writeLocalFile(vertical: string, data: SocialStoreFile): void {
  const file = socialLocalFile(vertical);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function readStore(vertical: string): Promise<SocialStoreFile> {
  if (redisConfigured()) {
    const stored = await kvGetJson<SocialStoreFile>(socialRedisKey(vertical));
    if (!stored) return emptyStore();
    return {
      drafts: stored.drafts ?? [],
      usedXTweetIds: stored.usedXTweetIds ?? [],
      usedJobIds: stored.usedJobIds ?? [],
    };
  }
  return readLocalFile(vertical);
}

async function writeStore(vertical: string, data: SocialStoreFile): Promise<void> {
  if (redisConfigured()) {
    await kvSetJson(socialRedisKey(vertical), data);
    return;
  }
  writeLocalFile(vertical, data);
}

export async function listRecentDrafts(
  vertical: string,
  limit = 5,
): Promise<SocialDraftRecord[]> {
  const store = await readStore(vertical);
  return store.drafts.slice(-limit).reverse();
}

export async function getUsedXTweetIds(vertical: string): Promise<string[]> {
  const store = await readStore(vertical);
  return store.usedXTweetIds;
}

export async function getUsedJobIds(vertical: string): Promise<string[]> {
  const store = await readStore(vertical);
  return store.usedJobIds;
}

export async function saveDraft(input: {
  vertical: string;
  postType: string;
  draft: string;
  xTweetIds?: string[];
  jobId?: string;
}): Promise<SocialDraftRecord> {
  const store = await readStore(input.vertical);
  const record: SocialDraftRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vertical: input.vertical,
    postType: input.postType,
    draft: input.draft,
    createdAt: new Date().toISOString(),
    xTweetIds: input.xTweetIds ?? [],
    jobId: input.jobId,
  };

  store.drafts.push(record);
  store.drafts = store.drafts.slice(-50);

  if (input.xTweetIds?.length) {
    const merged = new Set([...store.usedXTweetIds, ...input.xTweetIds]);
    store.usedXTweetIds = [...merged].slice(-200);
  }
  if (input.jobId) {
    const merged = new Set([...store.usedJobIds, input.jobId]);
    store.usedJobIds = [...merged].slice(-100);
  }

  await writeStore(input.vertical, store);
  return record;
}
