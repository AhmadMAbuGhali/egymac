/** Bilingual admin dashboard labels */

export const ADMIN_TABS = {
  "site-content": { en: "Website Content", ar: "إدارة محتوى الموقع" },
  products: { en: "Catalog CRUD", ar: "إدارة الفهرس" },
  quotes: { en: "Inquiries Inbox", ar: "صندوق الوارد" },
  templates: { en: "Quote Templates", ar: "قوالب العروض" },
  offers: { en: "Create Offers", ar: "إنشاء العروض" },
  archive: { en: "Offers Archive", ar: "أرشيف العروض" },
};

export function adminLabel(key, lang) {
  return ADMIN_TABS[key]?.[lang] ?? key;
}

export const ADMIN_SHELL = {
  en: {
    dashboard: "Admin Dashboard",
    subtitle: "Egy Mac Control Center",
    logout: "Logout",
    loginTitle: "Admin Dashboard",
    loginHint: "Enter your authorized admin API key to access the internal dashboard.",
    loginPlaceholder: "Admin API Key",
    loginButton: "Unlock Dashboard",
    loginError: "Invalid admin key. Contact your system administrator.",
  },
  ar: {
    dashboard: "لوحة التحكم",
    subtitle: "مركز إيجي ماك",
    logout: "تسجيل الخروج",
    loginTitle: "لوحة التحكم",
    loginHint: "أدخل مفتاح API للوصول إلى لوحة الإدارة.",
    loginPlaceholder: "مفتاح المسؤول",
    loginButton: "فتح اللوحة",
    loginError: "مفتاح غير صالح. تواصل مع مسؤول النظام.",
  },
};
