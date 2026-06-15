/** Section visibility map — controls form desk + live preview + PDF export */

export const SECTION_LABELS = {
  documentMeta: { en: "Document Metadata", ar: "بيانات المستند" },
  greeting: { en: "Greeting Block", ar: "مقدمة التحية" },
  technicalSpecs: { en: "Technical Specifications", ar: "المواصفات الفنية" },
  commercialTerms: { en: "Commercial Terms", ar: "الشروط التجارية" },
  visualAttachments: { en: "Visual Attachments", ar: "المرفقات المصورة" },
  machineryItems: { en: "Machinery Sections", ar: "أقسام الماكينات" },
  closingNote: { en: "Closing Note", ar: "ملاحظة الختام" },
  signatures: { en: "Signature Blocks", ar: "التوقيعات" },
  companyFooter: { en: "Company Footer", ar: "تذييل الشركة" },
};

export function createDefaultSectionVisibility() {
  return {
    documentMeta: true,
    greeting: true,
    technicalSpecs: true,
    commercialTerms: true,
    visualAttachments: true,
    machineryItems: true,
    closingNote: true,
    signatures: true,
    companyFooter: true,
  };
}

export function mergeSectionVisibility(data) {
  const defaults = createDefaultSectionVisibility();
  if (!data || typeof data !== "object") return defaults;
  return { ...defaults, ...data };
}

export function isSectionVisible(visibility, key) {
  if (!visibility || typeof visibility !== "object") return true;
  return visibility[key] !== false;
}
