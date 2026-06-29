import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  configureAssetDir,
  ensureAssetDir,
  readAssetBuffer,
  resolveLocalAssetPath,
  saveAssetBuffer,
} from "./assetStorage.js";

let ASSET_DIR = null;

export function configureSiteAssetDir(dir) {
  ASSET_DIR = path.resolve(dir);
  configureAssetDir("site-assets", dir);
}

export function getSiteAssetDir() {
  return ASSET_DIR;
}

const DATA_URI_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

async function ensureDir() {
  await ensureAssetDir("site-assets");
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

export async function persistSiteImage(slot, imageSrc) {
  if (typeof imageSrc !== "string" || !imageSrc.trim()) return "";

  const src = imageSrc.trim();

  if (src.startsWith("/api/catalog/assets/")) {
    return src;
  }

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  const match = src.match(DATA_URI_RE);
  if (!match) {
    return src;
  }

  await ensureDir();

  const [, mime, b64] = match;
  const buf = Buffer.from(b64, "base64");
  if (buf.length > 4 * 1024 * 1024) {
    throw new Error(`Site image "${slot}" exceeds 4 MB after decode.`);
  }

  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
  const safeSlot = String(slot).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const filename = `site-${safeSlot}-${hash}${extForMime(mime)}`;
  await saveAssetBuffer("site-assets", filename, buf, mime);
  return assetUrl(filename);
}

export function resolveSiteAssetPath(filename) {
  return resolveLocalAssetPath("site-assets", filename);
}

export async function readSiteAssetBuffer(filename) {
  return readAssetBuffer("site-assets", filename);
}
