import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let DATA_DIR = process.env.EGYMAC_DATA_DIR
  ? path.resolve(process.env.EGYMAC_DATA_DIR)
  : path.join(__dirname, "..", "data");

/** Test-only: redirect JSON storage to an isolated directory */
export function configureDataDir(dir) {
  DATA_DIR = path.resolve(dir);
}

export function getDataDir() {
  return DATA_DIR;
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

/**
 * Read a JSON data file from backend/data/.
 */
export async function readJson(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    await writeJson(filename, defaultValue);
    return defaultValue;
  }
}

/** Persist data with exclusive lock (atomic write via temp file + rename). */
export async function writeJson(filename, data) {
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
  const release = await acquireLock(filename);
  try {
    let data;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = defaultValue;
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
