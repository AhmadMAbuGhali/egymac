/**
 * One-time migration from legacy productionLines.json + molds.json
 * into categories.json + products.json (bilingual nested catalog).
 */

import { readJson, writeJson } from "./jsonStore.js";
import { normalizeProduct } from "./catalogSchema.js";

const LINES_FILE = "productionLines.json";
const MOLDS_FILE = "molds.json";
const CATEGORIES_FILE = "categories.json";
const PRODUCTS_FILE = "products.json";

const LINE_FOCUS = [
  { id: "blocks", en: "Hollow & Solid Blocks", ar: "بلوك مجوف وصلب" },
  { id: "interlock", en: "Interlock & Pavers", ar: "بلاط متداخل" },
  { id: "curbstone", en: "Curbstones", ar: "بردورات" },
  { id: "multi-product", en: "Multi-Product Lines", ar: "خطوط متعددة المنتجات" },
];

const MOLD_TYPES = [
  { id: "interlock", en: "Interlock Shapes", ar: "أشكال بلاط متداخل" },
  { id: "hollow_block", en: "Hollow Blocks", ar: "بلوك مجوف" },
  { id: "solid_block", en: "Solid Blocks", ar: "بلوك صلب" },
  { id: "curbstone", en: "Curbstones", ar: "بردورات" },
  { id: "heavy_component", en: "Heavy Mechanical Components", ar: "مكونات ميكانيكية ثقيلة" },
];

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((i) => Number(i.id) || 0)) + 1;
}

export async function ensureCatalogMigrated() {
  const existingProducts = await readJson(PRODUCTS_FILE, []);
  if (existingProducts.length > 0) return { migrated: false };

  const lines = await readJson(LINES_FILE, []);
  const molds = await readJson(MOLDS_FILE, []);
  if (!lines.length && !molds.length) return { migrated: false };

  const categories = [];
  let catId = 1;

  const linesRoot = {
    id: catId++,
    nameEn: "Fully Automated Production Lines",
    nameAr: "خطوط إنتاج آلية بالكامل",
    parentId: null,
  };
  const moldsRoot = {
    id: catId++,
    nameEn: "Custom Molds & Heavy Parts",
    nameAr: "قوالب ومكونات ثقيلة مخصصة",
    parentId: null,
  };
  categories.push(linesRoot, moldsRoot);

  const lineFocusMap = {};
  for (const focus of LINE_FOCUS) {
    const cat = {
      id: catId++,
      nameEn: focus.en,
      nameAr: focus.ar,
      parentId: linesRoot.id,
    };
    categories.push(cat);
    lineFocusMap[focus.id] = cat.id;
  }

  const moldTypeMap = {};
  for (const mt of MOLD_TYPES) {
    const cat = {
      id: catId++,
      nameEn: mt.en,
      nameAr: mt.ar,
      parentId: moldsRoot.id,
    };
    categories.push(cat);
    moldTypeMap[mt.id] = cat.id;
  }

  const products = [];
  let prodId = 1;

  for (const line of lines) {
    products.push(
      normalizeProduct({
        id: prodId++,
        nameEn: line.title,
        nameAr: line.titleAr,
        descriptionEn: line.description,
        descriptionAr: line.descriptionAr,
        categoryId: lineFocusMap[line.productFocus] || linesRoot.id,
        images: line.imageUrl ? [line.imageUrl] : [],
      })
    );
  }

  for (const mold of molds) {
    products.push(
      normalizeProduct({
        id: prodId++,
        nameEn: mold.title,
        nameAr: mold.titleAr,
        descriptionEn: mold.specs,
        descriptionAr: mold.specsAr,
        categoryId: moldTypeMap[mold.moldType] || moldsRoot.id,
        images: mold.imageUrl ? [mold.imageUrl] : [],
      })
    );
  }

  await writeJson(CATEGORIES_FILE, categories);
  await writeJson(PRODUCTS_FILE, products);

  return { migrated: true, categories: categories.length, products: products.length };
}
