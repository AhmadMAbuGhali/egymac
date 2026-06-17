import { categoryLabel } from "./categoryTree.js";
import { productDisplayDescription, productDisplayName } from "../constants/catalogSchema.js";

/** Collect category id + all descendant ids */
export function getCategoryDescendantIds(categories, rootId) {
  const ids = new Set([Number(rootId)]);
  const walk = (parentId) => {
    for (const c of categories) {
      if (Number(c.parentId) === Number(parentId)) {
        ids.add(c.id);
        walk(c.id);
      }
    }
  };
  walk(rootId);
  return ids;
}

export function countProductsInCategory(products, categories, categoryId) {
  if (categoryId == null) return products.length;
  const ids = getCategoryDescendantIds(categories, categoryId);
  return products.filter((p) => ids.has(Number(p.categoryId))).length;
}

/** Root categories for top tab bar */
export function getRootCategories(categories) {
  return categories
    .filter((c) => c.parentId == null)
    .sort((a, b) => (a.nameEn || "").localeCompare(b.nameEn || ""));
}

export function extractProductSpecs(product, lang = "en") {
  const text = [
    product.nameEn,
    product.nameAr,
    product.descriptionEn,
    product.descriptionAr,
  ]
    .filter(Boolean)
    .join(" ");

  const specs = [];
  const L = (en, ar) => (lang === "ar" ? ar : en);

  const weight =
    text.match(/(\d+(?:\.\d+)?)\s*(?:kg|ton|tons|طن|كجم)/i)?.[0] ||
    text.match(/weight[:\s]+(\d+[^\s,]+)/i)?.[1];
  if (weight) {
    specs.push({ label: L("Weight", "الوزن"), value: weight.replace(/\s+/g, " ").trim() });
  }

  const dims =
    text.match(/(\d+\s*×\s*\d+\s*×\s*\d+\s*(?:cm|mm|سم|مم)?)/i)?.[1] ||
    text.match(/(\d+\s*mm\s*×\s*\d+\s*mm)/i)?.[1] ||
    text.match(/(\d+\s*cm\s*×\s*\d+\s*cm)/i)?.[1];
  if (dims) {
    specs.push({ label: L("Dimensions", "المقاس"), value: dims.replace(/\s+/g, " ").trim() });
  }

  const steel = text.match(/\b(Mn\d+|Steel\s*\d+|52|70|Hardox)\b/i)?.[0];
  if (steel) {
    specs.push({ label: L("Material", "الخامة"), value: steel });
  }

  const compat = [...new Set((text.match(/(Zenith|Masa|Hess|Columbia|Omeg)(?:\s*\d+)?/gi) || []).map((s) => s.trim()))];
  if (compat.length) {
    specs.push({ label: L("Compat.", "التوافق"), value: compat.slice(0, 2).join(" · ") });
  }

  if (product.images?.length > 1) {
    specs.push({
      label: L("Photos", "صور"),
      value: String(product.images.length),
    });
  }

  return specs.slice(0, 4);
}

export function isCustomEngineered(product) {
  const text = `${product.descriptionEn || ""} ${product.descriptionAr || ""} ${product.nameEn || ""} ${product.nameAr || ""}`.toLowerCase();
  return /custom|bespoke|مخصص|حسب الطلب|from scratch|engineered/.test(text);
}

export function filterCatalogProducts(
  products,
  categories,
  { search, categoryId, subCategoryId }
) {
  let list = [...products];
  const activeCategory = subCategoryId ?? categoryId;

  if (activeCategory != null) {
    const ids = getCategoryDescendantIds(categories, activeCategory);
    list = list.filter((p) => ids.has(Number(p.categoryId)));
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((p) => {
      const blob = [
        p.nameEn,
        p.nameAr,
        p.descriptionEn,
        p.descriptionAr,
        productDisplayName(p, "en"),
        productDisplayName(p, "ar"),
        productDisplayDescription(p, "en"),
        productDisplayDescription(p, "ar"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  return list;
}

export function categoryTabLabel(cat, lang, count) {
  const name = categoryLabel(cat, lang);
  return `${name} (${count})`;
}
