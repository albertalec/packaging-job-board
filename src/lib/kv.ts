import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

export function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

export function getRedis(): Redis {
  if (!redisConfigured()) {
    throw new Error("Upstash Redis is not configured");
  }
  if (client === undefined || client === null) {
    client = Redis.fromEnv();
  }
  return client;
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const value = await getRedis().get<T>(key);
  return value ?? null;
}

export async function kvSetJson(key: string, value: unknown): Promise<void> {
  await getRedis().set(key, value);
}

export function sponsorshipRedisKey(vertical: string): string {
  return `nicheboard:sponsorships:${vertical}`;
}

export function alertsRedisKey(vertical: string): string {
  return `nicheboard:alerts:${vertical}`;
}
