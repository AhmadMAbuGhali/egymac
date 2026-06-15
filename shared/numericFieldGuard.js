/**
 * Strict sanitization for price, quantity, and dimension fields.
 * Rejects negative values, scientific notation, and overflow strings.
 */

const SCI_NOTATION_RE = /[eE][+-]?\d+/;
const MAX_QUANTITY = 999_999_999;
const MAX_PRICE_DIGITS = 15;

export function sanitizePriceInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (SCI_NOTATION_RE.test(raw)) return "";
  if (/^-/.test(raw)) return "";

  let cleaned = raw.replace(/[^\d.,\s]/g, "");
  if (cleaned.startsWith("-")) return "";

  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (digitsOnly.length > MAX_PRICE_DIGITS) {
    cleaned = cleaned.slice(0, MAX_PRICE_DIGITS + 4);
  }

  const dotCount = (cleaned.match(/\./g) || []).length;
  if (dotCount > 1) {
    const firstDot = cleaned.indexOf(".");
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }

  return cleaned.trim();
}

export function sanitizeQuantityInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (SCI_NOTATION_RE.test(raw)) return "";
  if (/^-/.test(raw)) return "";

  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n > MAX_QUANTITY) return String(MAX_QUANTITY);
  return String(n);
}

export function sanitizeDimensionInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (SCI_NOTATION_RE.test(raw)) return "";
  if (/[<>]/.test(raw)) return "";

  let cleaned = raw.replace(/[^\d.,\s×xX\-/A-Za-z\u0600-\u06FF%]/g, "");
  if (/^-\s*\d/.test(cleaned) || cleaned.startsWith("-")) {
    cleaned = cleaned.replace(/^-+/, "");
  }

  if (cleaned.length > 128) cleaned = cleaned.slice(0, 128);
  return cleaned.trim();
}

export function parsePriceNumber(value) {
  const sanitized = sanitizePriceInput(value);
  if (!sanitized) return null;
  const n = parseFloat(sanitized.replace(/,/g, "").replace(/\s/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
