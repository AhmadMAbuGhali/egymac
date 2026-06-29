import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import {
  BUNDLED_DATA_DIR,
  resolveWritableDir,
  seedBundledFiles,
} from "./runtimePaths.js";
import {
  assetBlobKey,
  deleteBlobPrefix,
  hasBlobStorage,
  readBlobBuffer,
  writeBlobBuffer,
} from "./blobStorage.js";
import { hasRedisStorage } from "./persistentStorage.js";
import {
  deleteRedisByPrefix,
  readRedisBuffer,
  redisAssetKey,
  writeRedisBuffer,
} from "./redisStorage.js";

function envVarForSubdir(subdir) {
  return subdir === "catalog-images" ? "EGYMAC_CATALOG_IMAGE_DIR" : "EGYMAC_SITE_ASSET_DIR";
}

const dirOverrides = {};

/** Test-only: force asset reads/writes to a specific directory */
export function configureAssetDir(subdir, dir) {
  if (dir) dirOverrides[subdir] = path.resolve(dir);
  else delete dirOverrides[subdir];
}

function writableDir(subdir) {
  if (dirOverrides[subdir]) return dirOverrides[subdir];
  return resolveWritableDir(envVarForSubdir(subdir), subdir);
}

function bundledDir(subdir) {
  return path.join(BUNDLED_DATA_DIR, subdir);
}

export function mimeForFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function ensureAssetDir(subdir) {
  if (hasBlobStorage() || hasRedisStorage()) return;
  await seedBundledFiles(bundledDir(subdir), writableDir(subdir));
}

export async function saveAssetBuffer(subdir, filename, buffer, contentType) {
  const safe = path.basename(filename);
  if (hasRedisStorage()) {
    await writeRedisBuffer(redisAssetKey(subdir, safe), buffer);
    return;
  }
  if (hasBlobStorage()) {
    await writeBlobBuffer(assetBlobKey(subdir, safe), buffer, contentType);
    return;
  }
  const dir = writableDir(subdir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safe), buffer);
}

export async function readAssetBuffer(subdir, filename) {
  const safe = path.basename(filename);
  if (hasRedisStorage()) {
    const fromRedis = await readRedisBuffer(redisAssetKey(subdir, safe));
    if (fromRedis) return fromRedis;
  }
  if (hasBlobStorage()) {
    const fromBlob = await readBlobBuffer(assetBlobKey(subdir, safe));
    if (fromBlob) return fromBlob;
  }
  const dir = writableDir(subdir);
  const primary = path.join(dir, safe);
  if (fsSync.existsSync(primary)) return fs.readFile(primary);
  const bundled = path.join(bundledDir(subdir), safe);
  if (fsSync.existsSync(bundled)) return fs.readFile(bundled);
  return null;
}

export async function deleteAssetsWithPrefix(subdir, prefix) {
  if (hasRedisStorage()) {
    await deleteRedisByPrefix(`egymac:asset:${subdir}:${prefix}`);
    return;
  }
  if (hasBlobStorage()) {
    await deleteBlobPrefix(`egymac/${subdir}/${prefix}`);
    return;
  }
  const dir = writableDir(subdir);
  await ensureAssetDir(subdir);
  const files = await fs.readdir(dir);
  await Promise.all(
    files
      .filter((f) => f.startsWith(prefix))
      .map((f) => fs.unlink(path.join(dir, f)).catch(() => {}))
  );
}

/** Legacy helper — local path when file exists on disk (tests / dev). */
export function resolveLocalAssetPath(subdir, filename) {
  const safe = path.basename(filename);
  const primary = path.join(writableDir(subdir), safe);
  if (fsSync.existsSync(primary)) return primary;
  const bundled = path.join(bundledDir(subdir), safe);
  if (fsSync.existsSync(bundled)) return bundled;
  return primary;
}
