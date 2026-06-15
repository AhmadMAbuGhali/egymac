/** Hardcoded brand — html2canvas reads inline styles, not Tailwind tokens */
export const BRAND_PRIMARY = "#3b767c";
export const BRAND_PRIMARY_DARK = "#2e6569";
export const BRAND_PRIMARY_LIGHT = "#e9f3f4";

export const TH_INLINE_STYLE = {
  backgroundColor: BRAND_PRIMARY,
  color: "#ffffff",
  fontFamily: "Cairo, sans-serif",
};

export const META_BANNER_STYLE = {
  backgroundColor: BRAND_PRIMARY_LIGHT,
  border: `1px solid ${BRAND_PRIMARY}`,
};

export const SECTION_BANNER_STYLE = {
  borderBottom: `2px solid ${BRAND_PRIMARY}`,
  color: BRAND_PRIMARY,
  fontFamily: "Cairo, sans-serif",
};

export const FOOTER_ACCENT_STYLE = {
  borderTop: `2px solid ${BRAND_PRIMARY}`,
  backgroundColor: BRAND_PRIMARY_LIGHT,
};
