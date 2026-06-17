const API = import.meta.env.VITE_API_BASE ?? (import.meta.env.PROD ? "/_/backend/api" : "/api");

async function request(endpoint, { adminKey, ...options } = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(adminKey ? { "X-Admin-Key": adminKey } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const text = await res.text();

  let data = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) throw new Error(text.slice(0, 200) || "Request failed");
      data = { success: true };
    }
  }

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── Catalog (Production Lines + Molds) ──────────────────────────────────────
export function getCatalog(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/catalog${qs ? `?${qs}` : ""}`);
}

export function getProductionLines(adminKey) {
  return request("/catalog/production-lines", { adminKey });
}

export function createProductionLine(body, adminKey) {
  return request("/catalog/production-lines", { method: "POST", body: JSON.stringify(body), adminKey });
}

export function updateProductionLine(id, body, adminKey) {
  return request(`/catalog/production-lines/${id}`, { method: "PUT", body: JSON.stringify(body), adminKey });
}

export function deleteProductionLine(id, adminKey) {
  return request(`/catalog/production-lines/${id}`, { method: "DELETE", adminKey });
}

export function getMolds(adminKey) {
  return request("/catalog/molds", { adminKey });
}

export function createMold(body, adminKey) {
  return request("/catalog/molds", { method: "POST", body: JSON.stringify(body), adminKey });
}

export function updateMold(id, body, adminKey) {
  return request(`/catalog/molds/${id}`, { method: "PUT", body: JSON.stringify(body), adminKey });
}

export function deleteMold(id, adminKey) {
  return request(`/catalog/molds/${id}`, { method: "DELETE", adminKey });
}

// ─── Unified Bilingual Catalog (Categories + Products) ───────────────────────
export function getCategories(adminKey) {
  return request("/catalog/categories", { adminKey });
}

export function createCategory(body, adminKey) {
  return request("/catalog/categories", { method: "POST", body: JSON.stringify(body), adminKey });
}

export function updateCategory(id, body, adminKey) {
  return request(`/catalog/categories/${id}`, { method: "PUT", body: JSON.stringify(body), adminKey });
}

export function deleteCategory(id, adminKey) {
  return request(`/catalog/categories/${id}`, { method: "DELETE", adminKey });
}

export function getCatalogProducts(params = {}, adminKey) {
  const qs = new URLSearchParams(params).toString();
  return request(`/catalog/products${qs ? `?${qs}` : ""}`, { adminKey });
}

export function createProduct(body, adminKey) {
  return request("/catalog/products", { method: "POST", body: JSON.stringify(body), adminKey });
}

export function updateProduct(id, body, adminKey) {
  return request(`/catalog/products/${id}`, { method: "PUT", body: JSON.stringify(body), adminKey });
}

export function deleteProduct(id, adminKey) {
  return request(`/catalog/products/${id}`, { method: "DELETE", adminKey });
}

/** @deprecated use getCatalog */
export function getProducts(params = {}) {
  return getCatalog(params);
}

// ─── Site Content CMS ────────────────────────────────────────────────────────
export function getSiteContent() {
  return request("/site-content");
}

export function updateSiteContent(body, adminKey) {
  return request("/site-content", { method: "POST", body: JSON.stringify(body), adminKey });
}

// ─── Site Texts ──────────────────────────────────────────────────────────────
export function getSiteTexts() {
  return request("/site-texts");
}

export function updateSiteTexts(body, adminKey) {
  return request("/site-texts", { method: "PUT", body: JSON.stringify(body), adminKey });
}

// ─── Inquiries ───────────────────────────────────────────────────────────────
export function submitInquiry(body) {
  return request("/inquiries", { method: "POST", body: JSON.stringify(body) });
}

export function getInquiries(adminKey) {
  return request("/inquiries", { adminKey });
}

export function patchInquiry(id, body, adminKey) {
  return request(`/inquiries/${id}`, { method: "PATCH", body: JSON.stringify(body), adminKey });
}

export function getQuoteTemplates(adminKey) {
  return request("/templates", { adminKey });
}

export function getQuoteTemplate(id, adminKey) {
  return request(`/templates/${id}`, { adminKey });
}

export function saveQuoteTemplate(body, adminKey) {
  return request("/templates", { method: "POST", body: JSON.stringify(body), adminKey });
}

export function deleteQuoteTemplate(id, adminKey) {
  return request(`/templates/${id}`, { method: "DELETE", adminKey });
}

// ─── Free-form Price Offers (Dynamic / unrestricted) ─────────────────────────
export function getSavedQuotes(adminKey, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.salespersonId) qs.set("salespersonId", filters.salespersonId);
  if (filters.startDate) qs.set("startDate", filters.startDate);
  if (filters.endDate) qs.set("endDate", filters.endDate);
  const query = qs.toString();
  return request(`/quotations${query ? `?${query}` : ""}`, { adminKey });
}

export function getSavedQuote(id, adminKey) {
  return request(`/quotations/${id}`, { adminKey });
}

export function getFreeFormQuoteTemplate(adminKey) {
  return request("/quotations/template", { adminKey });
}

export function saveFreeFormQuote(body, adminKey) {
  return request("/quotations/save", { method: "POST", body: JSON.stringify(body), adminKey });
}

export async function downloadQuotePdfById(id, printMode, adminKey) {
  const mode = printMode === "compact" ? "compact" : "spanned";
  const qs = new URLSearchParams({ printMode: mode });
  const res = await fetch(`${API}/quotations/${id}/pdf?${qs}`, {
    method: "GET",
    headers: { "X-Admin-Key": adminKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = "PDF generation failed";
    if (text.trim()) {
      try {
        message = JSON.parse(text).message || message;
      } catch {
        message = text.slice(0, 200);
      }
    }
    throw new Error(message);
  }
  return res.blob();
}

/** @deprecated Use downloadQuotePdfById after save */
export async function generateFreeFormQuotePdf(quote, printMode, adminKey) {
  if (quote?.id) {
    return downloadQuotePdfById(quote.id, printMode, adminKey);
  }
  throw new Error("Save the offer first, then generate PDF by id.");
}

export function deleteSavedQuote(id, adminKey) {
  return request(`/quotations/${id}`, { method: "DELETE", adminKey });
}

// ─── Sales Team ──────────────────────────────────────────────────────────────
export function getSalespersons(adminKey) {
  return request("/salespersons", { adminKey });
}

export function createSalesperson(name, adminKey) {
  return request("/salespersons", { method: "POST", body: JSON.stringify({ name }), adminKey });
}

export function deleteSalesperson(id, adminKey) {
  return request(`/salespersons/${id}`, { method: "DELETE", adminKey });
}

// ─── Legacy Quotation Generator (PDF parse/generate) ─────────────────────────
export function getQuotationTemplate(adminKey) {
  return request("/quotation/template", { adminKey });
}

export async function parseQuotationPdf(file, adminKey) {
  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch(`${API}/quotation/parse`, {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "PDF parse failed");
  return data;
}

export async function generateQuotationPdf(quotation, adminKey) {
  const res = await fetch(`${API}/quotation/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
    body: JSON.stringify(quotation),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "PDF generation failed");
  }
  return res.blob();
}
