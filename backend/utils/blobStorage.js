import path from "path";
import { getRequestOidcToken } from "./requestOidc.js";

function onVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

/** True when Vercel Blob credentials are available (persistent storage). */
export function hasBlobStorage() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (!process.env.BLOB_STORE_ID) return false;
  return Boolean(process.env.VERCEL_OIDC_TOKEN || onVercelRuntime());
}

export function blobAccess() {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

let blobModule = null;
let oidcModule = null;

async function loadBlob() {
  if (!blobModule) {
    blobModule = await import("@vercel/blob");
  }
  return blobModule;
}

async function loadOidc() {
  if (!oidcModule) {
    oidcModule = await import("@vercel/oidc");
  }
  return oidcModule;
}

/** Resolve Blob auth for experimentalServices where project env may not inject OIDC. */
async function resolveBlobAuthOptions() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { token: process.env.BLOB_READ_WRITE_TOKEN };
  }

  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) return {};

  const requestOidc = getRequestOidcToken();
  if (requestOidc) {
    return { oidcToken: requestOidc, storeId };
  }

  const envOidc = process.env.VERCEL_OIDC_TOKEN;
  if (envOidc) {
    return { oidcToken: envOidc, storeId };
  }

  if (!onVercelRuntime()) return { storeId };

  try {
    const { getVercelOidcToken } = await loadOidc();
    const oidcToken = await getVercelOidcToken();
    if (oidcToken) return { oidcToken, storeId };
  } catch {
    // Fall through
  }

  return { storeId };
}

async function withBlobAuth(extra = {}) {
  return { access: blobAccess(), ...(await resolveBlobAuthOptions()), ...extra };
}

async function bearerToken() {
  const auth = await resolveBlobAuthOptions();
  if (auth.token) return auth.token;
  if (auth.oidcToken) return auth.oidcToken;
  return null;
}

/** List API fallback — private-store GET by pathname often 404s while list still finds the blob. */
async function findBlobEntry(pathname, auth) {
  const { list } = await loadBlob();
  let cursor;
  do {
    const page = await list({ prefix: pathname, cursor, ...auth });
    const exact = page.blobs.find((b) => b.pathname === pathname);
    if (exact) return exact;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return null;
}

/** Read blob bytes via list + downloadUrl (works when SDK get() misses OIDC private objects). */
async function fetchBlobEntryText(entry, auth) {
  const token = (await bearerToken()) || auth.token || auth.oidcToken;
  const url = entry.downloadUrl || entry.url;
  if (!url || !token) return null;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.text();
}

export async function readBlobText(pathname) {
  const auth = await withBlobAuth();
  const { get } = await loadBlob();

  try {
    const direct = await get(pathname, auth);
    if (direct?.stream) {
      const text = await new Response(direct.stream).text();
      if (text) return text;
    }
  } catch {
    // Fall through to list + downloadUrl
  }

  const entry = await findBlobEntry(pathname, auth);
  if (!entry) return null;
  return fetchBlobEntryText(entry, auth);
}

export async function writeBlobText(pathname, text, contentType = "application/json") {
  const { put } = await loadBlob();
  const auth = await withBlobAuth();
  await put(pathname, text, {
    ...auth,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

export async function readBlobBuffer(pathname) {
  const text = await readBlobText(pathname);
  return text != null ? Buffer.from(text, "utf-8") : null;
}

export async function writeBlobBuffer(pathname, buffer, contentType) {
  const { put } = await loadBlob();
  const auth = await withBlobAuth();
  await put(pathname, buffer, {
    ...auth,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

export async function deleteBlobPrefix(prefix) {
  const { list, del } = await loadBlob();
  const auth = await withBlobAuth();
  let cursor;
  do {
    const page = await list({ prefix, cursor, ...auth });
    if (page.blobs.length) {
      await del(page.blobs.map((b) => b.url), auth);
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

export async function probeBlobAuth() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { mode: "read-write-token", ok: true };
  }
  if (!process.env.BLOB_STORE_ID) {
    return { mode: "none", ok: false };
  }
  if (getRequestOidcToken()) {
    return { mode: "request-header-oidc", ok: true };
  }
  if (process.env.VERCEL_OIDC_TOKEN) {
    return { mode: "env-oidc", ok: true };
  }
  if (!onVercelRuntime()) {
    return { mode: "local", ok: false };
  }
  try {
    const { getVercelOidcToken } = await loadOidc();
    const token = await getVercelOidcToken();
    return { mode: "runtime-oidc", ok: Boolean(token) };
  } catch (err) {
    return { mode: "runtime-oidc", ok: false, error: err?.message || String(err) };
  }
}

export async function probeBlobRoundTrip() {
  if (!hasBlobStorage()) {
    return { ok: false, error: "Blob storage not configured" };
  }

  const pathname = jsonBlobKey("__health_probe.json");
  const payload = JSON.stringify({ probe: true, at: new Date().toISOString() });

  try {
    await writeBlobText(pathname, payload);
    const readBack = await readBlobText(pathname);
    if (readBack !== payload) {
      return {
        ok: false,
        error: readBack == null ? "Read returned empty" : "Read payload mismatch",
      };
    }
    try {
      const { del } = await loadBlob();
      const auth = await withBlobAuth();
      const entry = await findBlobEntry(pathname, auth);
      if (entry?.url) await del(entry.url, auth);
    } catch {
      // cleanup optional
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
