/** Empty free-form price offer scaffold — every field editable by admin. */

import { applyQuoteExtensions } from "./quoteExtensions.js";
import { sanitizeQuoteStrings } from "./sanitizeText.js";
import { buildFixedSignatureBlocks } from "./fixedSignatureBlock.js";

export const DEFAULT_TECH_COLUMNS = {
  serial: "م",
  parameter: "التفاصيل الفنية",
  value: "الوصف",
};

export const DEFAULT_COMM_COLUMNS = {
  serial: "م",
  termKey: "البند",
  termValue: "الوصف",
};

export const DEFAULT_COMPANY_FOOTER = {
  companyName: "EGY MAC MACHINE — إيجي ماك",
  headquartersAr: "المقر الرئيسي: فيلا رقم 5 - شارع 291 - المعادي - القاهرة.",
  headquartersEn: "Main Office: Villa No. 5 - Street 291 - Maadi - Cairo",
  factoryAr: "المصنع: منطقة أبو رواش الصناعية - الكيلو 26 - الجيزة",
  factoryEn: "Factory: Abu Rawash Industrial Zone - Kilo 26 - Giza",
  website: "egymac.net",
  phone: "+201228004646",
  extraLines: [],
};

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

export function createSpecRow(id, serial = "") {
  return { id, serial: serial || String(id), parameter: "", value: "" };
}

export function createTermRow(id, serial = "") {
  return { id, serial: serial || String(id), termKey: "", termValue: "" };
}

function createSignature(id, title = "", name = "") {
  const blocks = buildFixedSignatureBlocks();
  const preset = blocks[id - 1] || { title: "", name: "" };
  return { id, title: title || preset.title, name: name || preset.name };
}

export function createEmptyFreeFormQuote() {
  return {
    documentTitle: "عرض سعر / Price Offer",
    referenceNumber: `EMPL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    clientName: "",
    greeting:
      "تحية طيبة وبعد،،،\nيسعدنا أن نتقدم لسيادتكم بعرض السعر الفني والتجاري التالي، وفق المواصفات والبنود الموضحة أدناه.",
    technicalSectionTitle: "المواصفات الفنية / Technical Specifications",
    technicalColumns: { ...DEFAULT_TECH_COLUMNS },
    technicalSpecs: [createSpecRow(1)],
    commercialSectionTitle: "الشروط التجارية / Commercial Terms",
    commercialColumns: { ...DEFAULT_COMM_COLUMNS },
    commercialTerms: [createTermRow(1)],
    closingNote:
      "ملاحظة: ينتهي عرض السعر بعد 15 يوماً من تاريخه، ويخضع للتعديل في حالة تغيير المواصفات الفنية.",
    signatures: buildFixedSignatureBlocks(),
    salespersonId: null,
    companyFooter: normalizeCompanyFooter(),
  };
}

/** Merge partial/legacy payloads before persisting */
export function normalizeFreeFormQuote(data = {}) {
  const base = createEmptyFreeFormQuote();
  const merged = { ...base, ...data };

  merged.documentTitle = data.documentTitle ?? base.documentTitle;
  merged.technicalSectionTitle = data.technicalSectionTitle ?? base.technicalSectionTitle;
  merged.commercialSectionTitle = data.commercialSectionTitle ?? base.commercialSectionTitle;
  merged.technicalColumns = { ...DEFAULT_TECH_COLUMNS, ...(data.technicalColumns || {}) };
  merged.commercialColumns = { ...DEFAULT_COMM_COLUMNS, ...(data.commercialColumns || {}) };
  merged.companyFooter = normalizeCompanyFooter(data.companyFooter);

  merged.technicalSpecs = (data.technicalSpecs?.length ? data.technicalSpecs : base.technicalSpecs).map(
    (r, i) => ({ ...createSpecRow(r.id || i + 1), ...r })
  );

  merged.commercialTerms = (data.commercialTerms?.length ? data.commercialTerms : base.commercialTerms).map(
    (r, i) => ({ ...createTermRow(r.id || i + 1), ...r })
  );

  merged.salespersonId =
    data.salespersonId != null && data.salespersonId !== "" ? Number(data.salespersonId) : null;

  if (data.salespersonName) {
    merged.salespersonName = String(data.salespersonName);
  }

  const salesName =
    merged.salespersonName ||
    (data.signatures || []).find((s) => String(s?.title || "").includes("مسؤول"))?.name ||
    "";

  if (Array.isArray(data.signatures) && data.signatures.length) {
    merged.signatures = data.signatures.map((s, i) => ({
      ...createSignature(s?.id || i + 1),
      ...s,
      title: String(s?.title ?? ""),
      name: String(s?.name ?? ""),
    }));
  } else {
    merged.signatures = buildFixedSignatureBlocks(salesName);
  }

  return sanitizeQuoteStrings(applyQuoteExtensions(merged, data));
}
