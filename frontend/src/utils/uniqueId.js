/** Collision-resistant numeric IDs for rapid row/item add/delete cycles */
let _seq = 0;

export function nextUniqueId() {
  _seq = (_seq + 1) % 10000;
  return Date.now() * 10000 + _seq;
}

export function nextRowId(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return 1;
  const max = Math.max(...rows.map((r) => Number(r.id) || 0));
  return max + 1;
}

/** Safe string coercion for form fields — never throws on null/special chars */
export function safeText(value) {
  if (value == null) return "";
  return String(value);
}
