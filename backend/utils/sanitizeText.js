/** Server-side plain-text sanitization for quote payloads */

const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizePlainText(value, maxLength = 8000) {
  if (value == null) return "";
  let text = String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(CONTROL_CHAR_RE, "")
    .replace(/\u00a0/g, " ")
    .trim();
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return text;
}

export function sanitizeQuoteStrings(quote) {
  if (!quote || typeof quote !== "object") return quote;
  const next = { ...quote };

  for (const key of [
    "documentTitle",
    "referenceNumber",
    "date",
    "clientName",
    "greeting",
    "technicalSectionTitle",
    "commercialSectionTitle",
    "closingNote",
  ]) {
    if (key in next) next[key] = sanitizePlainText(next[key]);
  }

  if (Array.isArray(next.technicalSpecs)) {
    next.technicalSpecs = next.technicalSpecs.map((r) => ({
      ...r,
      serial: sanitizePlainText(r.serial, 32),
      parameter: sanitizePlainText(r.parameter),
      value: sanitizePlainText(r.value),
    }));
  }

  if (Array.isArray(next.commercialTerms)) {
    next.commercialTerms = next.commercialTerms.map((r) => ({
      ...r,
      serial: sanitizePlainText(r.serial, 32),
      termKey: sanitizePlainText(r.termKey),
      termValue: sanitizePlainText(r.termValue),
    }));
  }

  if (Array.isArray(next.signatures)) {
    next.signatures = next.signatures.map((s) => ({
      ...s,
      title: sanitizePlainText(s.title, 256),
      name: sanitizePlainText(s.name, 256),
    }));
  }

  return next;
}
