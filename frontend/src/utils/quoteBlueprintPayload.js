/**
 * Full quote workspace snapshot — templates mirror production quote payloads exactly.
 */

import { mergeSectionVisibility } from "../constants/quoteSectionVisibility.js";

function deepClone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

/** Resolve template row id from either numeric id or legacy _id. */
export function resolveTemplateId(template) {
  if (template == null) return null;
  if (typeof template === "object") {
    return template.id ?? template._id ?? null;
  }
  return template;
}

/**
 * Capture the complete active builder state — every row, term, footer line, and extension.
 */
export function captureQuoteWorkspaceSnapshot(
  quote,
  {
    templateStyle,
    visualAttachments,
    sectionVisibility,
    isClassic = true,
    isVisualOffer = false,
    keepClientName = true,
  } = {}
) {
  const snapshot = deepClone(quote) || {};

  delete snapshot.id;
  delete snapshot.savedAt;
  delete snapshot.archivedAt;

  if (!keepClientName) {
    snapshot.clientName = "";
  }

  snapshot.documentTitle = quote.documentTitle ?? "";
  snapshot.referenceNumber = quote.referenceNumber ?? "";
  snapshot.date = quote.date ?? "";
  snapshot.clientName = snapshot.clientName ?? quote.clientName ?? "";
  snapshot.greeting = quote.greeting ?? "";
  snapshot.closingNote = quote.closingNote ?? "";
  snapshot.technicalSectionTitle = quote.technicalSectionTitle ?? "";
  snapshot.commercialSectionTitle = quote.commercialSectionTitle ?? "";
  snapshot.technicalColumns = deepClone(quote.technicalColumns) || {};
  snapshot.commercialColumns = deepClone(quote.commercialColumns) || {};
  snapshot.technicalSpecs = deepClone(quote.technicalSpecs) || [];
  snapshot.commercialTerms = deepClone(quote.commercialTerms) || [];
  snapshot.signatures = deepClone(quote.signatures) || [];
  snapshot.companyFooter = deepClone(quote.companyFooter) || {};
  snapshot.sectionVisibility = deepClone(sectionVisibility) || {};

  if (quote.salespersonId != null && quote.salespersonId !== "") {
    snapshot.salespersonId = quote.salespersonId;
  } else {
    delete snapshot.salespersonId;
  }

  if (quote.salespersonName) {
    snapshot.salespersonName = quote.salespersonName;
  }

  if (Array.isArray(quote.machineryItems) && quote.machineryItems.length) {
    snapshot.machineryItems = deepClone(quote.machineryItems);
  }

  if (isVisualOffer) {
    snapshot.templateStyle = "machinery_detailed";
  } else {
    delete snapshot.templateStyle;
  }

  if (Array.isArray(visualAttachments) && visualAttachments.length > 0) {
    snapshot.visualAttachments = deepClone(visualAttachments);
  }

  return snapshot;
}

export function buildQuoteBlueprintPayload(quote, uiState = {}) {
  const { savedId = null, ...rest } = uiState;
  const payload = captureQuoteWorkspaceSnapshot(quote, rest);
  if (savedId) payload.id = savedId;
  return payload;
}

export function buildTemplateBlueprintPayload(quote, uiState = {}) {
  const payload = captureQuoteWorkspaceSnapshot(quote, uiState);
  delete payload.id;
  delete payload.savedAt;
  delete payload.archivedAt;
  return payload;
}

/**
 * Hydrate every builder field from a stored template payload.
 */
export function hydrateBuilderFromTemplatePayload(
  templateRow,
  {
    loadQuoteFork,
    setTemplateStyle,
    setVisualAttachments,
    setSectionVisibility,
    prevTemplateRef,
  }
) {
  const payload = templateRow?.payload;
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const cloned = deepClone(payload);
  let style = cloned.templateStyle || templateRow.templateStyle || "standard";
  if (style === "replica") style = "machinery_detailed";

  if (prevTemplateRef) {
    prevTemplateRef.current = style;
  }

  loadQuoteFork(cloned);

  const attachments = Array.isArray(cloned.visualAttachments) ? cloned.visualAttachments : [];
  setTemplateStyle(style);
  setVisualAttachments(attachments);
  setSectionVisibility(mergeSectionVisibility(cloned.sectionVisibility));
  return true;
}
