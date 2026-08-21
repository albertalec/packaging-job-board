import assert from "node:assert/strict";
import test from "node:test";
import {
  alertsRedisKey,
  redisConfigured,
  sponsorshipRedisKey,
} from "./kv";

test("redis key helpers are vertical-scoped", () => {
  assert.equal(sponsorshipRedisKey("packaging"), "nicheboard:sponsorships:packaging");
  assert.equal(alertsRedisKey("packaging"), "nicheboard:alerts:packaging");
  assert.notEqual(sponsorshipRedisKey("packaging"), sponsorshipRedisKey("supplychain"));
});

test("redisConfigured is false without env", () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    assert.equal(redisConfigured(), false);
  } finally {
    if (url !== undefined) process.env.UPSTASH_REDIS_REST_URL = url;
    if (token !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = token;
  }
});
