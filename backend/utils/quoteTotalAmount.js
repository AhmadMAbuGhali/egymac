/** Derive a numeric total from heterogeneous quote payloads */

const PRICE_KEY_RE = /(سعر|price|total|إجمال|amount|قيمة)/i;

function parseNumericAmount(raw) {
  if (raw == null) return 0;
  const text = String(raw).replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(text);
  return Number.isFinite(n) ? n : 0;
}

function sumMachineryPrices(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + parseNumericAmount(item?.price), 0);
}

function sumCommercialPrices(terms) {
  if (!Array.isArray(terms)) return 0;
  let total = 0;
  let matched = false;
  for (const row of terms) {
    const key = String(row?.termKey || "");
    const val = String(row?.termValue || "");
    if (PRICE_KEY_RE.test(key) || PRICE_KEY_RE.test(val)) {
      const n = parseNumericAmount(val) || parseNumericAmount(key);
      if (n > 0) {
        total += n;
        matched = true;
      }
    }
  }
  return matched ? total : 0;
}

export function computeQuoteTotalAmount(quote = {}) {
  if (quote.templateStyle === "machinery_detailed") {
    const machineryTotal = sumMachineryPrices(quote.machineryItems);
    if (machineryTotal > 0) return machineryTotal;
  }

  const commercialTotal = sumCommercialPrices(quote.commercialTerms);
  if (commercialTotal > 0) return commercialTotal;

  if (typeof quote.totalAmount === "number" && quote.totalAmount > 0) {
    return quote.totalAmount;
  }

  return 0;
}
