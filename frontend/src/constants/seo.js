/** Canonical public site URL (www preferred — matches live DNS). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.egymac.net").replace(/\/$/, "");

export const SITE_NAME = "Egy Mac Machine";
export const SITE_NAME_AR = "إيجي ماك";

export const DEFAULT_TITLE =
  "Egy Mac | Fully Automated Production Lines & Precision Engineering";

export const DEFAULT_DESCRIPTION =
  "Egy Mac engineers fully automated concrete production lines, custom heavy molds, and bespoke mechanical overhauling in Egypt. German engineering standards, made in Egypt.";

export const DEFAULT_DESCRIPTION_AR =
  "إيجي ماك — هندسة خطوط إنتاج آلية بالكامل، قوالب ثقيلة مخصصة، وصيانة وإعادة تصنيع هندسية في مصر بمعايير هندسية ألمانية.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export const KEYWORDS =
  "concrete block machine, production line, hollow block mold, interlock mold, curbstone mold, industrial machinery Egypt, Egy Mac, إيجي ماك, خط إنتاج بلوك, قوالب بلوك";

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function catalogProductUrl(productId) {
  return `/catalog?product=${encodeURIComponent(productId)}`;
}
