import { Router } from "express";
import { publicErrorMessage } from "../utils/safeError.js";
import { readJson, writeJson, nextId } from "../utils/jsonStore.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  normalizeCategory,
  normalizeProduct,
  validateCategory,
  validateProduct,
} from "../utils/catalogSchema.js";
import {
  buildChildrenMap,
  getDescendantIds,
  wouldCreateCycle,
  flattenWithPaths,
} from "../utils/categoryTree.js";
import { ensureCatalogMigrated } from "../utils/catalogMigration.js";
import { resolveSiteAssetPath } from "../utils/siteAssetStore.js";
import {
  persistCatalogImages,
  resolveCatalogImagePath,
  deleteCatalogAssetsForProduct,
  readCatalogImageBuffer,
  mimeForFilename,
} from "../utils/catalogImageStore.js";
import { readSiteAssetBuffer } from "../utils/siteAssetStore.js";
import fs from "fs";
import path from "path";

const router = Router();
const LINES_FILE = "productionLines.json";
const MOLDS_FILE = "molds.json";
const CATEGORIES_FILE = "categories.json";
const PRODUCTS_FILE = "products.json";

function filterLines(lines, query) {
  let result = [...lines];
  const { productFocus, search, featured } = query;

  if (productFocus) result = result.filter((l) => l.productFocus === productFocus);
  if (featured === "true") result = result.filter((l) => l.featured);

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.titleAr?.includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.capacity?.toLowerCase().includes(q)
    );
  }
  return result;
}

function filterMolds(molds, query) {
  let result = [...molds];
  const { moldType, compatibility, search, featured } = query;

  if (moldType) result = result.filter((m) => m.moldType === moldType);
  if (compatibility) result = result.filter((m) => m.compatibility?.includes(compatibility));
  if (featured === "true") result = result.filter((m) => m.featured);
  if (query.repairAvailable === "true") result = result.filter((m) => m.repairAvailable);

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.titleAr?.includes(q) ||
        m.specs?.toLowerCase().includes(q) ||
        m.steelGrade?.toLowerCase().includes(q) ||
        m.compatibility?.some((b) => b.toLowerCase().includes(q))
    );
  }
  return result;
}

function filterProducts(products, categories, query) {
  let result = [...products];
  const { categoryId, search, includeSubcategories } = query;

  if (categoryId) {
    const cid = Number(categoryId);
    if (includeSubcategories === "true") {
      const descendants = getDescendantIds(categories, cid);
      const allowed = new Set([cid, ...descendants]);
      result = result.filter((p) => allowed.has(Number(p.categoryId)));
    } else {
      result = result.filter((p) => Number(p.categoryId) === cid);
    }
  }

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.nameEn?.toLowerCase().includes(q) ||
        p.nameAr?.includes(q) ||
        p.descriptionEn?.toLowerCase().includes(q) ||
        p.descriptionAr?.includes(q)
    );
  }

  return result;
}

async function loadCatalogCore() {
  await ensureCatalogMigrated();
  const categories = (await readJson(CATEGORIES_FILE, [])).map(normalizeCategory);
  const products = (await readJson(PRODUCTS_FILE, [])).map(normalizeProduct);
  return { categories, products };
}

/**
 * GET /api/catalog
 * Legacy + unified: returns productionLines, molds, categories, products
 */
router.get("/", async (req, res) => {
  try {
    const productionLines = await readJson(LINES_FILE, []);
    const molds = await readJson(MOLDS_FILE, []);
    const { categories, products } = await loadCatalogCore();
    const { facet } = req.query;

    if (facet === "lines") {
      const data = filterLines(productionLines, req.query);
      return res.json({ success: true, count: data.length, productionLines: data, molds: [] });
    }

    if (facet === "molds") {
      const data = filterMolds(molds, req.query);
      return res.json({ success: true, count: data.length, productionLines: [], molds: data });
    }

    if (facet === "products") {
      const data = filterProducts(products, categories, req.query);
      return res.json({
        success: true,
        count: data.length,
        categories,
        products: data,
        productionLines: [],
        molds: [],
      });
    }

    const filteredLines = filterLines(productionLines, req.query);
    const filteredMolds = filterMolds(molds, req.query);
    const filteredProducts = filterProducts(products, categories, req.query);

    res.json({
      success: true,
      count: filteredLines.length + filteredMolds.length + filteredProducts.length,
      productionLines: filteredLines,
      molds: filteredMolds,
      categories,
      products: filteredProducts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

// ─── Catalog image assets (disk-backed, not Base64 in JSON) ──────────────────

router.get("/assets/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    let buffer =
      (await readCatalogImageBuffer(filename)) || (await readSiteAssetBuffer(filename));

    if (!buffer) {
      let filePath = resolveCatalogImagePath(filename);
      if (!fs.existsSync(filePath)) {
        filePath = resolveSiteAssetPath(filename);
      }
      if (fs.existsSync(filePath)) {
        buffer = await fs.promises.readFile(filePath);
      }
    }

    if (!buffer) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", mimeForFilename(filename));
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

// ─── Categories CRUD ─────────────────────────────────────────────────────────

router.get("/categories", async (_req, res) => {
  try {
    const { categories } = await loadCatalogCore();
    const childrenMap = buildChildrenMap(categories);
    res.json({
      success: true,
      data: categories,
      tree: childrenMap.get(null) || [],
      flat: flattenWithPaths(categories, "en"),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const categories = (await readJson(CATEGORIES_FILE, [])).map(normalizeCategory);
    const item = normalizeCategory(req.body);
    const errors = validateCategory(item, categories);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });

    item.id = nextId(categories);
    categories.push(item);
    await writeJson(CATEGORIES_FILE, categories);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

router.put("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const categories = (await readJson(CATEGORIES_FILE, [])).map(normalizeCategory);
    const idx = categories.findIndex((c) => c.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: "Category not found" });

    const item = normalizeCategory({ ...categories[idx], ...req.body, id: categories[idx].id });

    if (wouldCreateCycle(categories, item.id, item.parentId)) {
      return res.status(400).json({ success: false, message: "Invalid parent: would create a cycle." });
    }

    const errors = validateCategory(item, categories, item.id);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });

    categories[idx] = item;
    await writeJson(CATEGORIES_FILE, categories);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const categories = (await readJson(CATEGORIES_FILE, [])).map(normalizeCategory);
    const products = (await readJson(PRODUCTS_FILE, [])).map(normalizeProduct);
    const id = Number(req.params.id);

    const hasChildren = categories.some((c) => Number(c.parentId) === id);
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: category has sub-categories. Remove or reassign them first.",
      });
    }

    const hasProducts = products.some((p) => Number(p.categoryId) === id);
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: products are assigned to this category.",
      });
    }

    const filtered = categories.filter((c) => c.id !== id);
    if (filtered.length === categories.length) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await writeJson(CATEGORIES_FILE, filtered);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

// ─── Products CRUD ───────────────────────────────────────────────────────────

router.get("/products", async (req, res) => {
  try {
    const { categories, products } = await loadCatalogCore();
    const data = filterProducts(products, categories, req.query);
    res.json({ success: true, count: data.length, data, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

router.post("/products", requireAdmin, async (req, res) => {
  try {
    const categories = (await readJson(CATEGORIES_FILE, [])).map(normalizeCategory);
    const products = (await readJson(PRODUCTS_FILE, [])).map(normalizeProduct);
    const draft = normalizeProduct(req.body);
    const errors = validateProduct(draft, categories);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });

    const id = nextId(products);
    const images = await persistCatalogImages(id, draft.images);
    const item = { ...draft, id, images };
    products.push(item);
    await writeJson(PRODUCTS_FILE, products);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

router.put("/products/:id", requireAdmin, async (req, res) => {
  try {
    const categories = (await readJson(CATEGORIES_FILE, [])).map(normalizeCategory);
    const products = (await readJson(PRODUCTS_FILE, [])).map(normalizeProduct);
    const idx = products.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: "Product not found" });

    const draft = normalizeProduct({ ...products[idx], ...req.body, id: products[idx].id });
    const errors = validateProduct(draft, categories);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });

    const images = await persistCatalogImages(draft.id, draft.images);
    const item = { ...draft, images };
    products[idx] = item;
    await writeJson(PRODUCTS_FILE, products);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  try {
    const products = (await readJson(PRODUCTS_FILE, [])).map(normalizeProduct);
    const id = Number(req.params.id);
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    await deleteCatalogAssetsForProduct(id);
    await writeJson(PRODUCTS_FILE, filtered);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: publicErrorMessage(err) });
  }
});

// ─── Legacy Production Lines CRUD ──────────────────────────────────────────────
router.get("/production-lines", async (_req, res) => {
  const data = await readJson(LINES_FILE, []);
  res.json({ success: true, data });
});

router.post("/production-lines", requireAdmin, async (req, res) => {
  const items = await readJson(LINES_FILE, []);
  const item = { id: nextId(items), ...req.body };
  items.push(item);
  await writeJson(LINES_FILE, items);
  res.status(201).json({ success: true, data: item });
});

router.put("/production-lines/:id", requireAdmin, async (req, res) => {
  const items = await readJson(LINES_FILE, []);
  const idx = items.findIndex((i) => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: "Not found" });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  await writeJson(LINES_FILE, items);
  res.json({ success: true, data: items[idx] });
});

router.delete("/production-lines/:id", requireAdmin, async (req, res) => {
  const items = await readJson(LINES_FILE, []);
  const filtered = items.filter((i) => i.id !== Number(req.params.id));
  if (filtered.length === items.length) return res.status(404).json({ success: false, message: "Not found" });
  await writeJson(LINES_FILE, filtered);
  res.json({ success: true, message: "Deleted" });
});

// ─── Legacy Molds CRUD ───────────────────────────────────────────────────────
router.get("/molds", async (_req, res) => {
  const data = await readJson(MOLDS_FILE, []);
  res.json({ success: true, data });
});

router.post("/molds", requireAdmin, async (req, res) => {
  const items = await readJson(MOLDS_FILE, []);
  const item = {
    id: nextId(items),
    compatibility: Array.isArray(req.body.compatibility) ? req.body.compatibility : [],
    ...req.body,
  };
  items.push(item);
  await writeJson(MOLDS_FILE, items);
  res.status(201).json({ success: true, data: item });
});

router.put("/molds/:id", requireAdmin, async (req, res) => {
  const items = await readJson(MOLDS_FILE, []);
  const idx = items.findIndex((i) => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: "Not found" });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  await writeJson(MOLDS_FILE, items);
  res.json({ success: true, data: items[idx] });
});

router.delete("/molds/:id", requireAdmin, async (req, res) => {
  const items = await readJson(MOLDS_FILE, []);
  const filtered = items.filter((i) => i.id !== Number(req.params.id));
  if (filtered.length === items.length) return res.status(404).json({ success: false, message: "Not found" });
  await writeJson(MOLDS_FILE, filtered);
  res.json({ success: true, message: "Deleted" });
});

export default router;
