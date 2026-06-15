import { mkdtemp, rm, readFile, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { configureDataDir, readJson } from "../utils/jsonStore.js";
import {
  configureSiteAssetDir,
  persistSiteImage,
  resolveSiteAssetPath,
} from "../utils/siteAssetStore.js";
import { DEFAULT_SITE_CONTENT } from "../routes/siteContent.js";

const TINY_PNG_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("siteAssetStore", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "egymac-site-asset-"));
    configureSiteAssetDir(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists hero background data-uri to disk with catalog asset URL", async () => {
    const url = await persistSiteImage("hero-bg", TINY_PNG_URI);
    expect(url).toMatch(/^\/api\/catalog\/assets\/site-hero-bg-[a-f0-9]+\.png$/);

    const filename = url.split("/").pop();
    const buf = await readFile(resolveSiteAssetPath(filename));
    expect(buf.length).toBeGreaterThan(0);
  });

  it("preserves existing asset URLs unchanged", async () => {
    const existing = "/api/catalog/assets/site-hero-bg-abc.png";
    expect(await persistSiteImage("hero-bg", existing)).toBe(existing);
  });
});

describe("site_content.json defaults", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "egymac-site-json-"));
    configureDataDir(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("seeds DEFAULT_SITE_CONTENT when file is missing", async () => {
    const data = await readJson("site_content.json", DEFAULT_SITE_CONTENT);
    expect(data.hero.title.ar).toBeTruthy();
    expect(data.features.length).toBeGreaterThanOrEqual(4);
    expect(data.contact.phone).toMatch(/^\+20/);

    const files = await readdir(tempDir);
    expect(files).toContain("site_content.json");
  });
});
