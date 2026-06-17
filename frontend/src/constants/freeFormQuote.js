/** Free-form B2B price offer — fully dynamic, no hardcoded limits */

import {
  DEFAULT_COMPANY_FOOTER,
  normalizeCompanyFooter,
} from "./contact.js";

export { DEFAULT_COMPANY_FOOTER, normalizeCompanyFooter };

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

export function createEmptyFreeFormQuote() {
  return {
    documentTitle: "عرض سعر / Price Offer",
    referenceNumber: `EMPL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
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

export function createSpecRow(id, serial = "") {
  return { id, serial: serial || String(id), parameter: "", value: "" };
}

export function createTermRow(id, serial = "") {
  return { id, serial: serial || String(id), termKey: "", termValue: "" };
}

export function createSignature(id, title = "", name = "") {
  const blocks = buildFixedSignatureBlocks();
  const preset = blocks[id - 1] || { title: "", name: "" };
  return { id, title: title || preset.title, name: name || preset.name };
}

import { normalizeMachineryItems } from "./machineryQuote.js";
import { mergeSectionVisibility } from "./quoteSectionVisibility.js";
import { buildFixedSignatureBlocks } from "./signatures.js";

/** Normalize legacy or partial payloads from archive */
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

  if (data.templateStyle === "replica" || data.templateStyle === "machinery_detailed") {
    merged.templateStyle = "machinery_detailed";
  }

  if (Array.isArray(data.machineryItems)) {
    merged.machineryItems = normalizeMachineryItems(data.machineryItems);
  }

  if (Array.isArray(data.visualAttachments)) {
    merged.visualAttachments = data.visualAttachments.filter(
      (a) => a && typeof a.src === "string" && a.src.startsWith("data:image/")
    );
  }

  merged.sectionVisibility = mergeSectionVisibility(data.sectionVisibility);

  return merged;
}

export function signatureGridClass(count) {
  const n = Math.max(1, Math.min(count, 6));
  const map = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };
  return map[n];
}
