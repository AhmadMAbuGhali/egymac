/**
 * Template payloads mirror archived quote payloads exactly — same rows,
 * tables, extensions, and calculations. Only quote lifecycle meta is stripped.
 */

import { normalizeFreeFormQuote } from "./freeFormQuoteTemplate.js";

export function stripQuoteLifecycleMeta(payload) {
  const clean = { ...payload };
  delete clean.id;
  delete clean.savedAt;
  delete clean.archivedAt;
  return clean;
}

/** Normalize incoming builder/archive data into a storable template payload. */
export function prepareTemplatePayload(rawPayload = {}) {
  return stripQuoteLifecycleMeta(normalizeFreeFormQuote(rawPayload));
}

/** Resolve stored template row into a full quote-shaped payload for the builder. */
export function resolveTemplatePayload(row = {}) {
  if (row.payload && typeof row.payload === "object" && Object.keys(row.payload).length > 0) {
    return prepareTemplatePayload(row.payload);
  }

  const payload = normalizeFreeFormQuote({});
  const style = row.templateStyle;
  if (style === "replica" || style === "machinery_detailed") {
    payload.templateStyle = style;
  }
  return payload;
}
