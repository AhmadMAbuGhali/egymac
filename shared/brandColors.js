/** EGY MAC brand palette — single source of truth for print & UI */

/** Primary brand teal — all accents, headers, CTAs, documents */
export const BRAND_PRIMARY = "#3b767c";
export const BRAND_PRIMARY_DARK = "#2e6569";
export const BRAND_PRIMARY_LIGHT = "#e9f3f4";

/** @deprecated Use BRAND_PRIMARY — kept as alias for legacy imports */
export const BRAND_CTA = BRAND_PRIMARY;

export const BRAND_ROW_ALT = "#F9FAFB";
export const BRAND_BORDER = "#E5E7EB";

/** Typography scale tokens (px) — spanned / compact */
export const OFFER_TYPO = {
  spanned: {
    client: "1.25rem",
    greeting: "0.875rem",
    section: "0.875rem",
    tableHead: "0.875rem",
    tableBody: "0.875rem",
    cellPad: "10px 14px",
    lineHeight: "1.625",
  },
  compact: {
    client: "1.125rem",
    greeting: "0.8125rem",
    section: "0.8125rem",
    tableHead: "0.75rem",
    tableBody: "0.75rem",
    cellPad: "8px 12px",
    lineHeight: "1.625",
  },
};
