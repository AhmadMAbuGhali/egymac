/**
 * Extension fields for free-form quotes (machinery, replica, visual).
 * Shared normalization for save/load/PDF — keeps payloads bulletproof.
 */

import { mergeSectionVisibility } from "./quoteSectionVisibility.js";

const VALID_TEMPLATE_STYLES = new Set(["standard", "replica", "machinery_detailed"]);

export function normalizeMachineryItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => ({
    id: item?.id ?? i + 1,
    title: String(item?.title ?? ""),
    image:
      typeof item?.image === "string" && item.image.startsWith("data:image/")
        ? item.image
        : null,
    imageCaption: String(item?.imageCaption ?? ""),
    specs: Array.isArray(item?.specs)
      ? item.specs.map((s, j) => ({
          id: s?.id ?? j + 1,
          label: String(s?.label ?? ""),
          value: String(s?.value ?? ""),
        }))
      : [],
    price: String(item?.price ?? ""),
    priceNote: String(item?.priceNote ?? ""),
  }));
}

export function normalizeVisualAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter((a) => a && typeof a.src === "string" && a.src.startsWith("data:image/"))
    .map((a, i) => ({
      id: a.id ?? `att-${i + 1}`,
      src: a.src,
      caption: String(a.caption ?? ""),
      source: a.source ?? "upload",
    }));
}

export function normalizeTemplateStyle(style) {
  if (typeof style === "string" && VALID_TEMPLATE_STYLES.has(style)) return style;
  return undefined;
}

/** Merge extension fields onto a normalized quote object */
export function applyQuoteExtensions(merged, data = {}) {
  const style = normalizeTemplateStyle(data.templateStyle);
  if (style) merged.templateStyle = style;

  if (Array.isArray(data.machineryItems)) {
    merged.machineryItems = normalizeMachineryItems(data.machineryItems);
  }

  if (Array.isArray(data.visualAttachments)) {
    merged.visualAttachments = normalizeVisualAttachments(data.visualAttachments);
  }

  if (data.sectionVisibility && typeof data.sectionVisibility === "object") {
    merged.sectionVisibility = mergeSectionVisibility(data.sectionVisibility);
  }

  if (data.salespersonId != null && data.salespersonId !== "") {
    merged.salespersonId = Number(data.salespersonId);
  }

  if (data.salespersonName) {
    merged.salespersonName = String(data.salespersonName);
  }

  return merged;
}
