/** Shared company contact — single source of truth for site + price offers */

export const PRIMARY_PHONE = "+201228004646";
export const PRIMARY_PHONE_DISPLAY = "+20 122 800 4646";
export const WHATSAPP_PHONE = "201228004646";

const WHATSAPP_PREFILL = {
  en: "Hello Egy Mac, I would like to inquire about your services.",
  ar: "مرحباً إيجي ماك، أود الاستفسار عن خدماتكم.",
};

export function whatsappUrl(lang = "en") {
  const text = WHATSAPP_PREFILL[lang] || WHATSAPP_PREFILL.en;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

export const COMPANY_NAME = "EGY MAC MACHINE — إيجي ماك";
export const WEBSITE = "egymac.net";

export const HEADQUARTERS_AR =
  "المقر الرئيسي: فيلا رقم 5 - شارع 291 - المعادي - القاهرة.";
export const HEADQUARTERS_EN = "Main Office: Villa No. 5 - Street 291 - Maadi - Cairo";

export const FACTORY_AR = "المصنع: منطقة أبو رواش الصناعية - الكيلو 26 - الجيزة";
export const FACTORY_EN = "Factory: Abu Rawash Industrial Zone - Kilo 26 - Giza";

export const DEFAULT_COMPANY_FOOTER = {
  companyName: COMPANY_NAME,
  headquartersAr: HEADQUARTERS_AR,
  headquartersEn: HEADQUARTERS_EN,
  factoryAr: FACTORY_AR,
  factoryEn: FACTORY_EN,
  website: WEBSITE,
  phone: PRIMARY_PHONE,
  extraLines: [],
};

/** Normalize legacy single-line HQ/factory fields into bilingual structure */
export function normalizeCompanyFooter(cf = {}) {
  const base = { ...DEFAULT_COMPANY_FOOTER, extraLines: [] };
  const merged = { ...base, ...cf };

  if (!cf.headquartersAr && cf.headquarters) {
    merged.headquartersEn = cf.headquarters;
  }
  if (!cf.factoryAr && cf.factory) {
    merged.factoryEn = cf.factory;
  }

  merged.extraLines = Array.isArray(cf.extraLines) ? cf.extraLines : [];

  delete merged.headquarters;
  delete merged.factory;

  return merged;
}
