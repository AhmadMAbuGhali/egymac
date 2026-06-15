import { mkdtemp, rm, readFile, access } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  configureDataDir,
  readJson,
  writeJson,
  mutateJson,
  nextId,
} from "../utils/jsonStore.js";

describe("jsonStore", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "egymac-json-"));
    configureDataDir(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("readJson creates default file when missing", async () => {
    const data = await readJson("missing.json", [{ id: 1 }]);
    expect(data).toEqual([{ id: 1 }]);
    const raw = await readFile(join(tempDir, "missing.json"), "utf-8");
    expect(JSON.parse(raw)).toEqual([{ id: 1 }]);
  });

  it("writeJson persists atomically via temp rename", async () => {
    await writeJson("items.json", [{ id: 1, name: "Alpha" }]);
    const data = await readJson("items.json", []);
    expect(data).toEqual([{ id: 1, name: "Alpha" }]);
    await access(join(tempDir, "items.json"));
  });

  it("nextId increments from max existing id", () => {
    expect(nextId([])).toBe(1);
    expect(nextId([{ id: 3 }, { id: 7 }])).toBe(8);
  });

  it("mutateJson applies transform under lock", async () => {
    await writeJson("counter.json", { count: 0 });
    const next = await mutateJson("counter.json", { count: 0 }, (data) => ({
      count: (data.count || 0) + 1,
    }));
    expect(next.count).toBe(1);
    const stored = await readJson("counter.json", { count: 0 });
    expect(stored.count).toBe(1);
  });

  it("concurrent mutateJson calls preserve data integrity (no race corruption)", async () => {
    await writeJson("counter.json", { count: 0 });

    const workers = Array.from({ length: 25 }, (_, i) =>
      mutateJson("counter.json", { count: 0 }, async (data) => {
        await new Promise((resolve) => setTimeout(resolve, i % 5));
        return { count: (Number(data.count) || 0) + 1 };
      })
    );

    await Promise.all(workers);

    const result = await readJson("counter.json", { count: 0 });
    expect(result.count).toBe(25);
  });

  it("concurrent append via mutateJson serializes safely", async () => {
    await writeJson("quotes.json", []);

    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        mutateJson("quotes.json", [], (quotes) => {
          const list = Array.isArray(quotes) ? [...quotes] : [];
          list.push({ id: nextId(list), label: `Q${i}` });
          return list;
        })
      )
    );

    const final = await readJson("quotes.json", []);
    expect(final.length).toBe(10);
    const ids = final.map((q) => q.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
