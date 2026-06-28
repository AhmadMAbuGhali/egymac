import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BACKEND_ROOT = path.join(__dirname, "..");
export const BUNDLED_DATA_DIR = path.join(BACKEND_ROOT, "data");

/** True when running inside Vercel/Lambda (read-only bundle at /var/task). */
export const IS_SERVERLESS =
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.VERCEL_ENV) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
  process.env.EGYMAC_USE_TMP_STORAGE === "1" ||
  BACKEND_ROOT.startsWith("/var/task") ||
  BUNDLED_DATA_DIR.startsWith("/var/task");

function tmpDirFor(subdir) {
  const slug = subdir || "data";
  return path.join("/tmp", "egymac", slug);
}

function bundledDir(subdir) {
  return subdir ? path.join(BUNDLED_DATA_DIR, subdir) : BUNDLED_DATA_DIR;
}

function isReadOnlyBundlePath(dir) {
  const resolved = path.resolve(dir);
  return resolved.startsWith("/var/task");
}

/**
 * Resolve a writable directory for runtime data.
 * @param {string} envVar - Optional override env var (e.g. EGYMAC_DATA_DIR)
 * @param {string} subdir - Relative path under bundled data ("" for JSON root, "catalog-images", etc.)
 */
export function resolveWritableDir(envVar, subdir = "") {
  const bundled = bundledDir(subdir);
  const tmp = tmpDirFor(subdir);

  if (process.env[envVar]) {
    const override = path.resolve(process.env[envVar]);
    if (IS_SERVERLESS && isReadOnlyBundlePath(override)) {
      return tmp;
    }
    return override;
  }

  if (IS_SERVERLESS) {
    return tmp;
  }

  return bundled;
}

/** Copy bundled files into a writable dir when missing (serverless cold start). */
export async function seedBundledFiles(bundledDir, writableDir) {
  await fs.mkdir(writableDir, { recursive: true });

  let entries;
  try {
    entries = await fs.readdir(bundledDir);
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (name) => {
      const src = path.join(bundledDir, name);
      const dest = path.join(writableDir, name);
      try {
        const stat = await fs.stat(src);
        if (!stat.isFile()) return;
        await fs.access(dest);
      } catch (err) {
        if (err?.code === "ENOENT") {
          await fs.copyFile(src, dest).catch(() => {});
        }
      }
    })
  );
}
