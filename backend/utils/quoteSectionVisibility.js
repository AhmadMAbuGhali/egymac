export function mergeSectionVisibility(data) {
  const defaults = {
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
  if (!data || typeof data !== "object") return defaults;
  return { ...defaults, ...data };
}

export function isSectionVisible(quote, key) {
  const v = quote?.sectionVisibility;
  if (!v || typeof v !== "object") return true;
  return v[key] !== false;
}
