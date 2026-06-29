import path from "path";

/** True when Vercel Blob credentials are available (persistent storage). */
export function hasBlobStorage() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );
}

export function blobAccess() {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

let blobModule = null;

async function loadBlob() {
  if (!blobModule) {
    blobModule = await import("@vercel/blob");
  }
  return blobModule;
}

export async function readBlobText(pathname) {
  const { get } = await loadBlob();
  const result = await get(pathname, { access: blobAccess() });
  if (!result) return null;
  return new Response(result.stream).text();
}

export async function writeBlobText(pathname, text, contentType = "application/json") {
  const { put } = await loadBlob();
  await put(pathname, text, {
    access: blobAccess(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

export async function readBlobBuffer(pathname) {
  const { get } = await loadBlob();
  const result = await get(pathname, { access: blobAccess() });
  if (!result) return null;
  const arr = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arr);
}

export async function writeBlobBuffer(pathname, buffer, contentType) {
  const { put } = await loadBlob();
  await put(pathname, buffer, {
    access: blobAccess(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

export async function deleteBlobPrefix(prefix) {
  const { list, del } = await loadBlob();
  let cursor;
  do {
    const page = await list({ prefix, cursor });
    if (page.blobs.length) {
      await del(page.blobs.map((b) => b.url));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

export function jsonBlobKey(filename) {
  return `egymac/data/${filename}`;
}

export function assetBlobKey(subdir, filename) {
  return `egymac/${subdir}/${path.basename(filename)}`;
}

export function getStorageBackend(forceFilesystem) {
  if (forceFilesystem) return "filesystem";
  if (hasBlobStorage()) return "vercel-blob";
  if (process.env.VERCEL || process.env.EGYMAC_USE_TMP_STORAGE === "1") return "ephemeral-tmp";
  return "filesystem";
}
