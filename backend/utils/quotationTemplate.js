/**
 * Default empty quotation template for "Create from scratch".
 */
export function createEmptyQuotation() {
  const date = new Date().toISOString().split("T")[0];
  const ref = `Q-${date.replace(/-/g, "")}-${String(Math.floor(Math.random() * 900) + 100)}`;

  return {
    referenceNumber: ref,
    date,
    client: { companyName: "", projectLocation: "", attentionTo: "" },
    items: [createEmptyItem(1)],
    commercial: {
      deliveryTimeline: "6–12 weeks engineering / fabrication from approved drawings",
      paymentTerms: "40% advance on approval, 40% on fabrication milestone, 20% on delivery & commissioning",
      warrantyCertification: "12 months German tech warranty — includes repair & re-manufactured components",
      validity: "30 days from issue date",
    },
    notes: "",
    currency: "EGP",
  };
}

export function createEmptyItem(id) {
  return {
    id,
    serviceCategory: "automated-line",
    equipmentMoldType: "",
    scopeOfWork: "",
    technicalSpecs: "",
    machineCompatibility: "",
    laborHours: "",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  };
}

/** Normalize legacy item fields */
export function normalizeItem(item) {
  return {
    ...item,
    serviceCategory: item.serviceCategory || "custom-mold-part",
    equipmentMoldType: item.equipmentMoldType || item.description || "",
    scopeOfWork: item.scopeOfWork || "",
    technicalSpecs: item.technicalSpecs || item.materialSpec || "",
    machineCompatibility: item.machineCompatibility || "",
    laborHours: item.laborHours ?? "",
  };
}

export function computeTotals(quotation) {
  const items = quotation.items.map((item) => {
    const normalized = normalizeItem(item);
    const qty = Number(normalized.quantity) || 0;
    const unit = Number(normalized.unitPrice) || 0;
    return { ...normalized, quantity: qty, unitPrice: unit, totalPrice: qty * unit };
  });

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  return { ...quotation, items, subtotal, grandTotal: subtotal };
}
