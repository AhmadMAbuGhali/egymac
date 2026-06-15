/** Catalog entity defaults — bilingual nested schema */

export const EMPTY_CATEGORY = {
  id: null,
  nameAr: "",
  nameEn: "",
  parentId: null,
};

export const EMPTY_PRODUCT = {
  id: null,
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  categoryId: null,
  images: [],
};

export const MAX_CATALOG_IMAGES = 12;
export const MAX_CATALOG_IMAGE_BYTES = 4 * 1024 * 1024;

export const ROOT_PARENT_VALUE = "";

export function validateBilingualProduct(product) {
  const missing = [];
  if (!product.nameAr?.trim()) missing.push("Arabic product name");
  if (!product.nameEn?.trim()) missing.push("English product name");
  if (!product.descriptionAr?.trim()) missing.push("Arabic description");
  if (!product.descriptionEn?.trim()) missing.push("English description");
  if (product.categoryId == null || product.categoryId === "") missing.push("Category");
  return missing;
}

export function validateBilingualCategory(category) {
  const missing = [];
  if (!category.nameAr?.trim()) missing.push("Arabic category name");
  if (!category.nameEn?.trim()) missing.push("English category name");
  return missing;
}

export function productDisplayName(product, lang = "en") {
  if (!product) return "";
  return lang === "ar" ? product.nameAr || product.nameEn : product.nameEn || product.nameAr;
}

export function productDisplayDescription(product, lang = "en") {
  if (!product) return "";
  return lang === "ar"
    ? product.descriptionAr || product.descriptionEn
    : product.descriptionEn || product.descriptionAr;
}

export function productPrimaryImage(product) {
  if (!product?.images?.length) return null;
  return product.images[0];
}
