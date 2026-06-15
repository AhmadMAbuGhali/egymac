/**
 * Sanitize inline-edit values — strip HTML, control chars, and zero-width junk.
 * Plain text only; prevents XSS in previews and stored quotes.
 */

const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;

function removeScriptAndStyleBlocks(value) {
  return String(value ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

export function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');
}

export function sanitizeEditText(value, { block = false, maxLength = 8000 } = {}) {
  let text = stripHtml(removeScriptAndStyleBlocks(value));
  text = text.replace(CONTROL_CHAR_RE, "").replace(ZERO_WIDTH_RE, "");
  text = text.replace(/\u00a0/g, " ");

  if (block) {
    text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  } else {
    text = text.replace(/[\r\n]+/g, " ");
  }

  text = text.trim();
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return text;
}

/** Optional: strip currency/number fields to safe printable text (no negative injection in display) */
export function sanitizeNumericDisplay(value) {
  const text = sanitizeEditText(value, { maxLength: 64 });
  if (!text) return text;
  return text
    .replace(/[^\d\s.,+%×xX/A-Za-z\u0600-\u06FF]/g, "")
    .replace(/^-+/, "")
    .trim();
}
