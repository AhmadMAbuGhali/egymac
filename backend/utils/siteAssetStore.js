import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import {
  BUNDLED_DATA_DIR,
  resolveWritableDir,
  seedBundledFiles,
} from "./runtimePaths.js";

const BUNDLED_ASSET_DIR = path.join(BUNDLED_DATA_DIR, "site-assets");

let ASSET_DIR = resolveWritableDir("EGYMAC_SITE_ASSET_DIR", "site-assets");

export function configureSiteAssetDir(dir) {
  ASSET_DIR = path.resolve(dir);
}

export function getSiteAssetDir() {
  return ASSET_DIR;
}

const DATA_URI_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

async function ensureDir() {
  await seedBundledFiles(BUNDLED_ASSET_DIR, ASSET_DIR);
}

function extForMime(mime) {
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";
  return ".jpg";
}

/** Shared catalog asset URL pattern — served via GET /api/catalog/assets/:filename */
function assetUrl(filename) {
  return `/api/catalog/assets/${filename}`;
}

/**
 * Persist a single image reference (data-URI, existing asset path, or https URL).
 * Returns normalized URL/path string.
 */
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
  const filePath = path.join(ASSET_DIR, filename);
  await fs.writeFile(filePath, buf);
  return assetUrl(filename);
}

export function resolveSiteAssetPath(filename) {
  const safe = path.basename(filename);
  const primary = path.join(ASSET_DIR, safe);
  if (fsSync.existsSync(primary)) return primary;
  const bundled = path.join(BUNDLED_ASSET_DIR, safe);
  if (fsSync.existsSync(bundled)) return bundled;
  return primary;
}
