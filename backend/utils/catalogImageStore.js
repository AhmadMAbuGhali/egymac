import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let IMAGE_DIR = process.env.EGYMAC_CATALOG_IMAGE_DIR
  ? path.resolve(process.env.EGYMAC_CATALOG_IMAGE_DIR)
  : path.join(__dirname, "..", "data", "catalog-images");

export function configureCatalogImageDir(dir) {
  IMAGE_DIR = path.resolve(dir);
}

export function getCatalogImageDir() {
  return IMAGE_DIR;
}

const DATA_URI_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

async function ensureDir() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
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
 * Persist data-URI images to disk; leave https URLs unchanged.
 * Returns normalized image reference array (paths, not raw base64).
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
    const filePath = path.join(IMAGE_DIR, filename);
    await fs.writeFile(filePath, buf);
    results.push(assetUrl(filename));
  }

  return results;
}

export function resolveCatalogImagePath(filename) {
  const safe = path.basename(filename);
  return path.join(IMAGE_DIR, safe);
}

export async function deleteCatalogAssetsForProduct(productId) {
  await ensureDir();
  const files = await fs.readdir(IMAGE_DIR);
  const prefix = `p${productId}-`;
  await Promise.all(
    files
      .filter((f) => f.startsWith(prefix))
      .map((f) => fs.unlink(path.join(IMAGE_DIR, f)).catch(() => {}))
  );
}
