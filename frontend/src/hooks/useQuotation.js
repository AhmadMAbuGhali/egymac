import { useState, useCallback, useMemo } from "react";

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
      warrantyCertification: "12 months German tech warranty on manufacturing defects — includes repair & re-manufactured components",
      validity: "30 days from issue date",
    },
    notes: "",
    currency: "EGP",
  };
}

function recalcItems(items) {
  return items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.unitPrice) || 0;
    return { ...item, totalPrice: qty * unit };
  });
}

function normalizeItemFields(item, fallbackId) {
  return {
    ...createEmptyItem(item.id || fallbackId),
    ...item,
    serviceCategory: item.serviceCategory || "custom-mold-part",
    equipmentMoldType: item.equipmentMoldType || item.description || "",
    scopeOfWork: item.scopeOfWork || "",
    technicalSpecs: item.technicalSpecs || item.materialSpec || "",
    machineCompatibility: item.machineCompatibility || "",
    laborHours: item.laborHours ?? "",
  };
}

export function useQuotation(initial = null) {
  const [quotation, setQuotation] = useState(initial || createEmptyQuotation());
  const [parseInfo, setParseInfo] = useState(null);

  const loadQuotation = useCallback((data, meta = null) => {
    const items = (data.items || []).map((item, i) => normalizeItemFields(item, i + 1));
    setQuotation({ ...createEmptyQuotation(), ...data, items: items.length ? items : [createEmptyItem(1)] });
    setParseInfo(meta);
  }, []);

  const resetQuotation = useCallback(() => {
    setQuotation(createEmptyQuotation());
    setParseInfo(null);
  }, []);

  const updateClient = useCallback((field, value) => {
    setQuotation((q) => ({ ...q, client: { ...q.client, [field]: value } }));
  }, []);

  const updateCommercial = useCallback((field, value) => {
    setQuotation((q) => ({ ...q, commercial: { ...q.commercial, [field]: value } }));
  }, []);

  const updateField = useCallback((field, value) => {
    setQuotation((q) => ({ ...q, [field]: value }));
  }, []);

  const updateItem = useCallback((id, field, value) => {
    setQuotation((q) => {
      const items = recalcItems(
        q.items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
      return { ...q, items };
    });
  }, []);

  const addItem = useCallback(() => {
    setQuotation((q) => {
      const nextId = Math.max(0, ...q.items.map((i) => i.id)) + 1;
      return { ...q, items: [...q.items, createEmptyItem(nextId)] };
    });
  }, []);

  const removeItem = useCallback((id) => {
    setQuotation((q) => {
      if (q.items.length <= 1) return q;
      return { ...q, items: q.items.filter((item) => item.id !== id) };
    });
  }, []);

  const grandTotal = useMemo(
    () => quotation.items.reduce((s, i) => s + (Number(i.totalPrice) || 0), 0),
    [quotation.items]
  );

  return {
    quotation, parseInfo, grandTotal,
    loadQuotation, resetQuotation,
    updateClient, updateCommercial, updateField,
    updateItem, addItem, removeItem,
  };
}
