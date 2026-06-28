import fs from "fs/promises";
import path from "path";
import {
  BUNDLED_DATA_DIR,
  IS_SERVERLESS,
  resolveWritableDir,
  seedBundledFiles,
} from "./runtimePaths.js";

let DATA_DIR = resolveWritableDir("EGYMAC_DATA_DIR", "");

/** Test-only: redirect JSON storage to an isolated directory */
export function configureDataDir(dir) {
  DATA_DIR = path.resolve(dir);
  initPromise = null;
}

export function getDataDir() {
  return DATA_DIR;
}

let initPromise = null;

async function ensureDataReady() {
  if (!initPromise) {
    initPromise = (async () => {
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

/**
 * Read a JSON data file. On serverless, reads/writes go to /tmp with bundled seed data.
 */
export async function readJson(filename, defaultValue = []) {
  await ensureDataReady();
  const filePath = path.join(DATA_DIR, filename);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    if (path.resolve(DATA_DIR) !== path.resolve(BUNDLED_DATA_DIR)) {
      try {
        const parsed = await readBundledJson(filename);
        await writeJson(filename, parsed);
        return parsed;
      } catch {
        // fall through to default
      }
    }

    await writeJson(filename, defaultValue);
    return defaultValue;
  }
}

/** Persist data with exclusive lock (atomic write via temp file + rename). */
export async function writeJson(filename, data) {
  await ensureDataReady();
  const release = await acquireLock(filename);
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tmpPath, filePath);
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => {});
    throw err;
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
      const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
      data = JSON.parse(raw);
    } catch {
      if (path.resolve(DATA_DIR) !== path.resolve(BUNDLED_DATA_DIR)) {
        try {
          data = await readBundledJson(filename);
        } catch {
          data = defaultValue;
        }
      } else {
        data = defaultValue;
      }
    }
    const next = await mutator(data);
    const tmpPath = path.join(DATA_DIR, `${filename}.${process.pid}.${Date.now()}.tmp`);
    await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf-8");
    await fs.rename(tmpPath, path.join(DATA_DIR, filename));
    return next;
  } finally {
    release();
  }
}
