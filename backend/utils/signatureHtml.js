function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainRtl(text, fallback = "—") {
  const value = String(text || "").trim() || fallback;
  return `<span dir="rtl" class="offer-align-ar">${esc(value)}</span>`;
}

/**
 * Classic template — fixed 3-column table signature row (RTL).
 */
export function renderClassicFixedSignatures(blocks) {
  if (!blocks?.length) return "";
  const cells = blocks
    .map(
      (s) => `<div class="offer-signature-card offer-signature-cell">
        <p class="offer-signature-title offer-align-ar">${plainRtl(s.title)}</p>
        <div class="offer-signature-line" style="background-color:#111827;height:1px;"></div>
        <p class="offer-signature-name offer-align-ar">${plainRtl(s.name, "")}</p>
      </div>`
    )
    .join("");

  return `<section class="offer-print-signatures offer-signature-row offer-signature-row--fixed">${cells}</section>`;
}

/**
 * Replica / Machinery — fixed 3-column table signature row.
 */
export function renderReplicaFixedSignatures(blocks, bidi) {
  if (!blocks?.length) return "";
  const render = bidi || ((t) => esc(t || "—"));
  const cells = blocks
    .map(
      (sig) => `<div class="rp-signature rp-signature-cell">
        <p class="rp-signature-title">${render(sig.title)}</p>
        <p class="rp-signature-name">${render(sig.name)}</p>
      </div>`
    )
    .join("");

  return `<div class="rp-signatures rp-signatures--fixed">${cells}</div>`;
}
