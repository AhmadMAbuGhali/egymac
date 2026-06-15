import { mkdtemp, rm, readFile, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  configureCatalogImageDir,
  persistCatalogImages,
  resolveCatalogImagePath,
  deleteCatalogAssetsForProduct,
} from "../utils/catalogImageStore.js";

/** 1×1 red PNG */
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const TINY_PNG_URI = `data:image/png;base64,${TINY_PNG_B64}`;

describe("catalogImageStore", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "egymac-catalog-img-"));
    configureCatalogImageDir(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("decodes base64 data URI and writes file to disk", async () => {
    const urls = await persistCatalogImages(42, [TINY_PNG_URI]);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/^\/api\/catalog\/assets\/p42-1-[a-f0-9]+\.png$/);

    const filename = urls[0].split("/").pop();
    const filePath = resolveCatalogImagePath(filename);
    const buf = await readFile(filePath);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("preserves existing asset URLs and https links unchanged", async () => {
    const existing = "/api/catalog/assets/p42-1-abc123.png";
    const remote = "https://cdn.example.com/image.jpg";
    const urls = await persistCatalogImages(42, [existing, remote, TINY_PNG_URI]);
    expect(urls[0]).toBe(existing);
    expect(urls[1]).toBe(remote);
    expect(urls[2]).toMatch(/\/api\/catalog\/assets\//);
  });

  it("rejects decoded images over 4 MB", async () => {
    const oversized = Buffer.alloc(4 * 1024 * 1024 + 1, 1);
    const hugeUri = `data:image/png;base64,${oversized.toString("base64")}`;
    await expect(persistCatalogImages(99, [hugeUri])).rejects.toThrow(/4 MB/);
  });

  it("deleteCatalogAssetsForProduct removes product-prefixed files", async () => {
    await persistCatalogImages(7, [TINY_PNG_URI, TINY_PNG_URI]);
    await persistCatalogImages(8, [TINY_PNG_URI]);

    let files = await readdir(tempDir);
    expect(files.some((f) => f.startsWith("p7-"))).toBe(true);
    expect(files.some((f) => f.startsWith("p8-"))).toBe(true);

    await deleteCatalogAssetsForProduct(7);

    files = await readdir(tempDir);
    expect(files.some((f) => f.startsWith("p7-"))).toBe(false);
    expect(files.some((f) => f.startsWith("p8-"))).toBe(true);
  });

  it("resolveCatalogImagePath prevents path traversal", () => {
    const safe = resolveCatalogImagePath("p1-1-abc.png");
    expect(safe).toBe(join(tempDir, "p1-1-abc.png"));

    const traversed = resolveCatalogImagePath("../../../etc/passwd");
    expect(traversed).toBe(join(tempDir, "passwd"));
    expect(traversed.includes("..")).toBe(false);
  });
});
