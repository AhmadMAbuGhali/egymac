import { MAX_CATALOG_IMAGE_BYTES, MAX_CATALOG_IMAGES } from "../constants/catalogSchema.js";

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple image files to Base64 data URIs sequentially.
 * Returns { images, errors }.
 */
export async function readImageFilesAsBase64(files, { existingCount = 0 } = {}) {
  const images = [];
  const errors = [];
  const list = Array.from(files || []);

  if (existingCount + list.length > MAX_CATALOG_IMAGES) {
    errors.push(`Maximum ${MAX_CATALOG_IMAGES} images per product.`);
    return { images, errors };
  }

  for (const file of list) {
    if (!file.type.startsWith("image/")) {
      errors.push(`"${file.name}" is not an image file.`);
      continue;
    }
    if (file.size > MAX_CATALOG_IMAGE_BYTES) {
      errors.push(`"${file.name}" exceeds 4 MB.`);
      continue;
    }
    try {
      const src = await fileToBase64(file);
      images.push(src);
    } catch (err) {
      errors.push(err.message);
    }
  }

  return { images, errors };
}
