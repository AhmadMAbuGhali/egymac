import { hasRedisStorage } from "./persistentStorage.js";

let redisClient = null;

async function getRedis() {
  if (!redisClient) {
    const { Redis } = await import("@upstash/redis");
    redisClient = Redis.fromEnv();
  }
  return redisClient;
}

export function redisJsonKey(filename) {
  return `egymac:json:${filename}`;
}

export function redisAssetKey(subdir, filename) {
  return `egymac:asset:${subdir}:${filename}`;
}

export async function readRedisText(key) {
  if (!hasRedisStorage()) return null;
  const redis = await getRedis();
  const value = await redis.get(key);
  if (value == null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export async function writeRedisText(key, text) {
  if (!hasRedisStorage()) return;
  const redis = await getRedis();
  await redis.set(key, text);
}

export async function readRedisBuffer(key) {
  if (!hasRedisStorage()) return null;
  const raw = await readRedisText(key);
  if (raw == null) return null;
  return Buffer.from(raw, "base64");
}

export async function writeRedisBuffer(key, buffer) {
  if (!hasRedisStorage()) return;
  await writeRedisText(key, buffer.toString("base64"));
}

export async function deleteRedisByPrefix(prefix) {
  if (!hasRedisStorage()) return;
  const redis = await getRedis();
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length) {
    await redis.del(...keys);
  }
}
