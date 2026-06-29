import fs from "fs/promises";
import path from "path";
import {
  BUNDLED_DATA_DIR,
  IS_SERVERLESS,
  resolveWritableDir,
  seedBundledFiles,
} from "./runtimePaths.js";
import {
  getStorageBackend,
  hasPersistentStorage,
  hasRedisStorage,
} from "./persistentStorage.js";
import {
  hasBlobStorage,
  jsonBlobKey,
  readBlobText,
  writeBlobText,
} from "./blobStorage.js";
import {
  readRedisText,
  redisJsonKey,
  writeRedisText,
} from "./redisStorage.js";

let DATA_DIR = resolveWritableDir("EGYMAC_DATA_DIR", "");
let forceFilesystem = false;

/** Test-only: redirect JSON storage to an isolated directory */
export function configureDataDir(dir) {
  DATA_DIR = path.resolve(dir);
  forceFilesystem = true;
  initPromise = null;
}

export function getDataDir() {
  return DATA_DIR;
}

export function getJsonStorageBackend() {
  return getStorageBackend(forceFilesystem);
}

let initPromise = null;

async function ensureDataReady() {
  if (!initPromise) {
    initPromise = (async () => {
      if (forceFilesystem || hasPersistentStorage()) {
        if (hasPersistentStorage()) return;
      }
      await fs.mkdir(DATA_DIR, { recursive: true });
      if (
        IS_SERVERLESS &&
        path.resolve(DATA_DIR) !== path.resolve(BUNDLED_DATA_DIR)
      ) {
        await seedBundledFiles(BUNDLED_DATA_DIR, DATA_DIR);
      }
    })();
  }
  await initPromise;
}

/** Per-file write mutex — prevents read-modify-write races on JSON stores */
const locks = new Map();

async function acquireLock(filename) {
  const prev = locks.get(filename) || Promise.resolve();
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });
  locks.set(filename, prev.then(() => next));
  await prev;
  return () => {
    release();
    if (locks.get(filename) === next) locks.delete(filename);
  };
}

async function readBundledJson(filename) {
  const raw = await fs.readFile(path.join(BUNDLED_DATA_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

async function readRawText(filename) {
  if (!forceFilesystem && hasRedisStorage()) {
    const fromRedis = await readRedisText(redisJsonKey(filename));
    if (fromRedis != null) return fromRedis;
  }
  if (!forceFilesystem && hasBlobStorage()) {
    const fromBlob = await readBlobText(jsonBlobKey(filename));
    if (fromBlob != null) return fromBlob;
  }
  const filePath = path.join(DATA_DIR, filename);
  return fs.readFile(filePath, "utf-8");
}

async function writeRawText(filename, text) {
  if (!forceFilesystem && hasRedisStorage()) {
    await writeRedisText(redisJsonKey(filename), text);
  }
  if (!forceFilesystem && hasBlobStorage()) {
    await writeBlobText(jsonBlobKey(filename), text);
  }
  if (forceFilesystem || !hasPersistentStorage()) {
    const filePath = path.join(DATA_DIR, filename);
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, text, "utf-8");
    await fs.rename(tmpPath, filePath);
  }
}

/**
 * Read a JSON data file. Uses Vercel Blob on production when connected, else local disk.
 */
export async function readJson(filename, defaultValue = []) {
  await ensureDataReady();

  try {
    const raw = await readRawText(filename);
    if (raw == null) throw new Error("missing");
    return JSON.parse(raw);
  } catch {
    try {
      const parsed = await readBundledJson(filename);
      await writeJson(filename, parsed);
      return parsed;
    } catch {
      // fall through
    }

    await writeJson(filename, defaultValue);
    return defaultValue;
  }
}

/** Persist data with exclusive lock (atomic write). */
export async function writeJson(filename, data) {
  await ensureDataReady();
  const release = await acquireLock(filename);
  const text = JSON.stringify(data, null, 2);
  try {
    await writeRawText(filename, text);
  } finally {
    release();
  }
}

export function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((i) => Number(i.id) || 0)) + 1;
}

/** Mutate JSON atomically: read → transform → write under lock */
export async function mutateJson(filename, defaultValue, mutator) {
  await ensureDataReady();
  const release = await acquireLock(filename);
  try {
    let data;
    try {
      const raw = await readRawText(filename);
      if (raw == null) throw new Error("missing");
      data = JSON.parse(raw);
    } catch {
      try {
        data = await readBundledJson(filename);
      } catch {
        data = defaultValue;
      }
    }
    const next = await mutator(data);
    await writeRawText(filename, JSON.stringify(next, null, 2));
    return next;
  } finally {
    release();
  }
}
