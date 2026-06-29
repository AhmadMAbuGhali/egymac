import { hasBlobStorage } from "./blobStorage.js";

/** True when Upstash Redis REST credentials are configured (Vercel Marketplace). */
export function hasRedisStorage() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/** Any durable cloud backend — not ephemeral /tmp. */
export function hasPersistentStorage() {
  return hasBlobStorage() || hasRedisStorage();
}

export function getStorageBackend(forceFilesystem) {
  if (forceFilesystem) return "filesystem";
  if (hasRedisStorage()) return "upstash-redis";
  if (hasBlobStorage()) return "vercel-blob";
  if (process.env.VERCEL || process.env.EGYMAC_USE_TMP_STORAGE === "1") {
    return "ephemeral-tmp";
  }
  return "filesystem";
}

export function getStorageDiagnostics(extra = {}) {
  return {
    persistent: hasPersistentStorage(),
    backend: getStorageBackend(false),
    blobReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    blobStoreId: Boolean(process.env.BLOB_STORE_ID),
    vercelOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN),
    upstashRedis: hasRedisStorage(),
    onVercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    ...extra,
  };
}

export function storageSetupHint() {
  if (hasPersistentStorage()) return null;
  if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    return "Local dev uses backend/data/ on disk.";
  }
  return (
    "Connect storage in Vercel: Project → Storage → Create Database → Blob (or Marketplace → Upstash Redis → Add). Then Redeploy."
  );
}
