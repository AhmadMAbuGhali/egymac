/** Fixed 3-tier signature row — RTL order: sales (right) · execution (center) · GM (left) */

export const SIGNATURE_EXECUTION_NAME = "أ. عبدو الغرباوي";
export const SIGNATURE_GM_NAME = "د. محمد محمود";

export const FIXED_SIGNATURE_TITLES = {
  sales: "مسؤول البيع",
  execution: "التنفيذ والإشراف",
  gm: "المدير العام",
};

export function buildFixedSignatureBlocks(salespersonName = "") {
  return [
    { id: 1, title: FIXED_SIGNATURE_TITLES.sales, name: String(salespersonName || "").trim() },
    { id: 2, title: FIXED_SIGNATURE_TITLES.execution, name: SIGNATURE_EXECUTION_NAME },
    { id: 3, title: FIXED_SIGNATURE_TITLES.gm, name: SIGNATURE_GM_NAME },
  ];
}

export function resolveSalespersonName(quote, salespersonsById = {}) {
  if (quote?.salespersonName) return String(quote.salespersonName).trim();
  const id = quote?.salespersonId;
  if (id != null && salespersonsById[String(id)]) {
    return salespersonsById[String(id)].name || "";
  }
  const legacy = (quote?.signatures || []).find((s) =>
    String(s?.title || "").includes("مسؤول")
  );
  return legacy?.name ? String(legacy.name).trim() : "";
}

export function resolveFixedSignaturesForQuote(quote, salespersonsById = {}) {
  const salesName = resolveSalespersonName(quote, salespersonsById);
  return buildFixedSignatureBlocks(salesName);
}
