/** Catalog entity normalization & validation */

const MAX_IMAGES = 12;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function normalizeCategory(raw = {}) {
  return {
    id: Number(raw.id) || 0,
    nameAr: String(raw.nameAr ?? "").trim(),
    nameEn: String(raw.nameEn ?? "").trim(),
    parentId:
      raw.parentId === null || raw.parentId === undefined || raw.parentId === ""
        ? null
        : Number(raw.parentId),
  };
}

export function normalizeProduct(raw = {}) {
  const images = Array.isArray(raw.images)
    ? raw.images.filter(
        (src) =>
          typeof src === "string" &&
          (src.startsWith("data:image/") ||
            src.startsWith("/api/catalog/assets/") ||
            /^https?:\/\//i.test(src))
      )
    : [];

  if (!images.length && typeof raw.imageUrl === "string" && raw.imageUrl.trim()) {
    images.push(raw.imageUrl.trim());
  }

  return {
    id: Number(raw.id) || 0,
    nameAr: String(raw.nameAr ?? raw.titleAr ?? "").trim(),
    nameEn: String(raw.nameEn ?? raw.title ?? "").trim(),
    descriptionAr: String(raw.descriptionAr ?? raw.specsAr ?? "").trim(),
    descriptionEn: String(raw.descriptionEn ?? raw.description ?? raw.specs ?? "").trim(),
    categoryId:
      raw.categoryId === null || raw.categoryId === undefined || raw.categoryId === ""
        ? null
        : Number(raw.categoryId),
    images: images.slice(0, MAX_IMAGES),
  };
}

export function validateCategory(category, allCategories = [], editingId = null) {
  const errors = [];
  if (!category.nameAr) errors.push("Arabic category name (nameAr) is required.");
  if (!category.nameEn) errors.push("English category name (nameEn) is required.");

  if (category.parentId != null) {
    const parent = allCategories.find((c) => Number(c.id) === Number(category.parentId));
    if (!parent) errors.push("Parent category does not exist.");
    if (editingId != null && Number(category.parentId) === Number(editingId)) {
      errors.push("A category cannot be its own parent.");
    }
  }

  return errors;
}

export function validateProduct(product, categories = []) {
  const errors = [];
  if (!product.nameAr) errors.push("Arabic product name (nameAr) is required.");
  if (!product.nameEn) errors.push("English product name (nameEn) is required.");
  if (!product.descriptionAr) errors.push("Arabic description (descriptionAr) is required.");
  if (!product.descriptionEn) errors.push("English description (descriptionEn) is required.");
  if (product.categoryId == null) errors.push("Category assignment (categoryId) is required.");
  else if (!categories.some((c) => Number(c.id) === Number(product.categoryId))) {
    errors.push("Selected category does not exist.");
  }

  if (product.images.length > MAX_IMAGES) {
    errors.push(`Maximum ${MAX_IMAGES} images allowed per product.`);
  }

  for (const src of product.images) {
    if (src.startsWith("data:image/")) {
      const approxBytes = Math.ceil((src.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        errors.push("One or more uploaded images exceed 4 MB.");
        break;
      }
    }
  }

  return errors;
}

export { MAX_IMAGES, MAX_IMAGE_BYTES };
