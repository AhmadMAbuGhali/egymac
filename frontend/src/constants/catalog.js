/** Catalog facets — Egy Mac service architecture */
export const CATALOG_FACETS = [
  {
    id: "lines",
    en: "Fully Automated Production Lines",
    ar: "خطوط إنتاج آلية بالكامل",
    descEn: "Turnkey engineering, installation, and bespoke fully automated factory line layouts — blocks, interlock, and curbstones.",
    descAr: "هندسة وتوريد وتركيب خطوط مصانع آلية بالكامل حسب الطلب — بلوك وبلاط وبردورات.",
  },
  {
    id: "molds",
    en: "Custom Molds & Heavy Parts",
    ar: "قوالب ومكونات ثقيلة مخصصة",
    descEn: "Designed from scratch or engineered as exact high-durability replacements — with full repair and re-manufacturing capability.",
    descAr: "تصميم وتصنيع من الصفر أو بدائل دقيقة عالية المتانة — مع إصلاح وإعادة تصنيع هندسي تخصصي.",
  },
];

export const MOLD_TYPES = [
  { id: "interlock", en: "Interlock Shapes", ar: "أشكال بلاط متداخل" },
  { id: "hollow_block", en: "Hollow Blocks", ar: "بلوك مجوف" },
  { id: "solid_block", en: "Solid Blocks", ar: "بلوك صلب" },
  { id: "curbstone", en: "Curbstones", ar: "بردورات" },
  { id: "heavy_component", en: "Heavy Mechanical Components", ar: "مكونات ميكانيكية ثقيلة" },
];

export const LINE_PRODUCT_FOCUS = [
  { id: "blocks", en: "Hollow & Solid Blocks", ar: "بلوك مجوف وصلب" },
  { id: "interlock", en: "Interlock & Pavers", ar: "بلاط متداخل" },
  { id: "curbstone", en: "Curbstones", ar: "بردورات" },
  { id: "multi-product", en: "Multi-Product Lines", ar: "خطوط متعددة المنتجات" },
];

export const COMPATIBILITY_BRANDS = ["Zenith", "Hess", "Masa", "Masa-Record"];

export const SERVICE_CATEGORIES = [
  { id: "automated-line", en: "Fully Automated Line", ar: "خط إنتاج آلي بالكامل" },
  { id: "custom-mold-part", en: "Custom Mold / Heavy Part", ar: "قالب / جزء مخصص" },
  { id: "repair-overhaul", en: "Repair & Overhaul", ar: "إصلاح وصيانة شاملة" },
  { id: "remanufacture", en: "Re-manufacture from Scratch", ar: "إعادة تصنيع من الصفر" },
];

export const OPERATIONAL_BADGES = {
  customFromScratch: { en: "Custom Manufactured from Scratch", ar: "تصنيع من الصفر" },
  repairAvailable: { en: "Bespoke Mechanical Overhauling & Re-manufacturing", ar: "صيانة هندسية وإعادة تصنيع" },
};

export const MOLD_TYPE_MAP = Object.fromEntries(MOLD_TYPES.map((m) => [m.id, m]));
export const LINE_FOCUS_MAP = Object.fromEntries(LINE_PRODUCT_FOCUS.map((f) => [f.id, f]));
export const SERVICE_CATEGORY_MAP = Object.fromEntries(SERVICE_CATEGORIES.map((s) => [s.id, s]));

export const ADMIN_KEY_STORAGE = "egymac_admin_key";

export const BRAND = {
  primary: "#3B767C",
  primaryDark: "#2E6569",
  primaryLight: "#E9F3F4",
  secondary: "#FFFFFF",
  gray: "#6B7280",
  charcoal: "#111827",
};
