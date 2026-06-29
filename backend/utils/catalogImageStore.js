import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  configureAssetDir,
  deleteAssetsWithPrefix,
  ensureAssetDir,
  mimeForFilename,
  readAssetBuffer,
  resolveLocalAssetPath,
  saveAssetBuffer,
} from "./assetStorage.js";

let IMAGE_DIR = null;

export function configureCatalogImageDir(dir) {
  IMAGE_DIR = path.resolve(dir);
  configureAssetDir("catalog-images", dir);
}

export function getCatalogImageDir() {
  return IMAGE_DIR;
}

const DATA_URI_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

async function ensureDir() {
  await ensureAssetDir("catalog-images");
}

function extForMime(mime) {
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return ".jpg";
}

function assetUrl(filename) {
  return `/api/catalog/assets/${filename}`;
}

/**
 * Persist data-URI images to storage; leave https URLs unchanged.
 */
export async function persistCatalogImages(productId, images = []) {
  await ensureDir();
  const results = [];

  for (let i = 0; i < images.length; i += 1) {
    const src = images[i];
    if (typeof src !== "string" || !src) continue;

    if (src.startsWith("/api/catalog/assets/")) {
      results.push(src);
      continue;
    }

    if (/^https?:\/\//i.test(src)) {
      results.push(src);
      continue;
    }

    const match = src.match(DATA_URI_RE);
    if (!match) continue;

    const [, mime, b64] = match;
    const buf = Buffer.from(b64, "base64");
    if (buf.length > 4 * 1024 * 1024) {
      throw new Error(`Catalog image ${i + 1} exceeds 4 MB after decode.`);
    }

    const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
    const filename = `p${productId}-${i + 1}-${hash}${extForMime(mime)}`;
    await saveAssetBuffer("catalog-images", filename, buf, mime);
    results.push(assetUrl(filename));
  }

  return results;
}

export function resolveCatalogImagePath(filename) {
  return resolveLocalAssetPath("catalog-images", filename);
}

export async function readCatalogImageBuffer(filename) {
  return readAssetBuffer("catalog-images", filename);
}

export { mimeForFilename };

export async function deleteCatalogAssetsForProduct(productId) {
  await deleteAssetsWithPrefix("catalog-images", `p${productId}-`);
}
