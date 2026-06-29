/** Canonical public site URL (www preferred — matches live DNS). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.egymac.net").replace(/\/$/, "");

export const SITE_NAME = "Egy Mac Machine";
export const SITE_NAME_AR = "إيجي ماك";

/** Primary ranking targets — concrete machinery Egypt + Arabic equivalents */
export const DEFAULT_TITLE =
  "Concrete Block Production Lines & Industrial Molds Egypt | Egy Mac";

export const DEFAULT_TITLE_AR =
  "خطوط إنتاج بلوك وقوالب صناعية في مصر | إيجي ماك";

export const DEFAULT_DESCRIPTION =
  "Egy Mac engineers fully automated concrete block production lines, hollow block molds, interlock molds, and heavy industrial machinery in Egypt. German engineering standards — design, fabrication, installation & overhaul.";

export const DEFAULT_DESCRIPTION_AR =
  "إيجي ماك — خطوط إنتاج بلوك آلية بالكامل، قوالب بلوك مجوف وبلاط متداخل، ومعدات صناعية ثقيلة في مصر. هندسة ألمانية من التصميم إلى التصنيع والتركيب والصيانة.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export const KEYWORDS =
  "concrete block machine Egypt, block production line, hollow block mold, interlock mold, curbstone mold, paving block machine, industrial machinery Egypt, Zenith mold, concrete machinery Cairo, Egy Mac, إيجي ماك, خط إنتاج بلوك, ماكينة بلوك, قوالب بلوك, قوالب انترلوك, معدات خرسانة مصر";

export const KEYWORDS_AR =
  "خط إنتاج بلوك مصر, ماكينة بلوك, قوالب بلوك مجوف, قوالب انترلوك, قوالب بردورات, معدات خرسانة, إيجي ماك, هندسة آلية, قوالب zenith";

export const GEO = {
  region: "EG-C",
  placename: "Cairo, Egypt",
  position: "30.0444;31.2357",
  icbm: "30.0444, 31.2357",
};

export const GOOGLE_SITE_VERIFICATION =
  import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "";

export const FAQ_ITEMS = {
  en: [
    {
      question: "What does Egy Mac manufacture in Egypt?",
      answer:
        "Egy Mac designs and builds fully automated concrete block production lines, hollow block and interlock molds, curbstone molds, and provides mechanical overhauling for industrial plants — from blueprint to fabrication and commissioning.",
    },
    {
      question: "Do you supply custom molds for block machines?",
      answer:
        "Yes. We engineer custom heavy-duty molds from scratch or as precision replacements for brands like Zenith — including hollow block, solid block, interlock, and curbstone profiles.",
    },
    {
      question: "Which areas in Egypt do you serve?",
      answer:
        "We serve factories and producers across Egypt and export markets, with engineering and fabrication based in Cairo. Contact us for site visits, line layout, and technical quotations.",
    },
    {
      question: "Are your production lines fully automated?",
      answer:
        "Yes. Our lines are fully automated end-to-end — batching, mixing, conveying, pressing, stacking, and curing — engineered to German standards and fabricated in Egypt.",
    },
  ],
  ar: [
    {
      question: "ماذا تصنع إيجي ماك في مصر؟",
      answer:
        "تصمم إيجي ماك وتبني خطوط إنتاج بلوك آلية بالكامل، وقوالب بلوك مجوف وبلاط متداخل وبردورات، مع صيانة وإعادة تصنيع للمصانع — من المخطط إلى التصنيع والتشغيل.",
    },
    {
      question: "هل توفرون قوالب مخصصة لماكينات البلوك؟",
      answer:
        "نعم. نهندس قوالب ثقيلة مخصصة من الصفر أو كبدائل دقيقة لعلامات مثل Zenith — بلوك مجوف وصلب وانترلوك وبردورات.",
    },
    {
      question: "ما المناطق التي تخدمونها في مصر؟",
      answer:
        "نخدم المصانع والمنتجين في جميع أنحاء مصر وأسواق التصدير، مع هندسة وتصنيع في القاهرة. تواصل معنا لزيارة الموقع والعروض الفنية.",
    },
    {
      question: "هل خطوط الإنتاج آلية بالكامل؟",
      answer:
        "نعم. خطوطنا آلية بالكامل — تلقيم وخلط ونقل وضغط وتكديس ومعالجة — بمعايير هندسية ألمانية وصنع في مصر.",
    },
  ],
};

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function catalogProductUrl(productId) {
  return `/catalog?product=${encodeURIComponent(productId)}`;
}

export function catalogCategoryUrl(categoryId) {
  return `/catalog?category=${encodeURIComponent(categoryId)}`;
}

export function pageKeywords(lang = "en") {
  return lang === "ar" ? KEYWORDS_AR : KEYWORDS;
}
