/** Fixed 3-tier signature row — RTL order: sales · execution · GM */

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

export function resolveFixedSignatures(quote, salespersonName = "") {
  const salesName =
    salespersonName ||
    quote?.salespersonName ||
    quote?.signatures?.find((s) => String(s?.title || "").includes("مسؤول"))?.name ||
    "";
  return buildFixedSignatureBlocks(salesName);
}
