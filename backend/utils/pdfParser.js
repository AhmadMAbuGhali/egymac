import { createEmptyQuotation, createEmptyItem, computeTotals } from "./quotationTemplate.js";

/**
 * Heuristic parser: extracts structured quotation fields from raw PDF text.
 * Falls back to mock/template data enriched with any detected values.
 */
export function parsePdfTextToQuotation(rawText) {
  const text = (rawText || "").replace(/\r\n/g, "\n");
  const base = createEmptyQuotation();

  // ─── Client fields ─────────────────────────────────────────────────────────
  const companyMatch = text.match(/(?:company|client|customer|to)[:\s]+([^\n]+)/i);
  const locationMatch = text.match(/(?:location|project|site)[:\s]+([^\n]+)/i);
  const attentionMatch = text.match(/(?:attention|attn|procurement)[:\s]+([^\n]+)/i);

  if (companyMatch) base.client.companyName = companyMatch[1].trim();
  if (locationMatch) base.client.projectLocation = locationMatch[1].trim();
  if (attentionMatch) base.client.attentionTo = attentionMatch[1].trim();

  // ─── Reference & date ──────────────────────────────────────────────────────
  const refMatch = text.match(/(?:ref|reference|quote|quotation)[#:\s]*([A-Z0-9\-\/]+)/i);
  const dateMatch = text.match(/(?:date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);

  if (refMatch) base.referenceNumber = refMatch[1].trim();
  if (dateMatch) {
    const d = dateMatch[1];
    base.date = d.includes("-") && d.length === 10 ? d : base.date;
  }

  // ─── Line items — look for rows with qty + price patterns ──────────────────
  const itemLines = text.split("\n").filter((line) => {
    const l = line.trim();
    return l.length > 10 && (/\d+\s*(?:x|×|pcs|units?|kg|set)/i.test(l) || /\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(l));
  });

  const parsedItems = [];
  let itemId = 1;

  for (const line of itemLines.slice(0, 15)) {
    const qtyMatch = line.match(/(?:qty|quantity|x|×)[:\s]*(\d+)/i) || line.match(/(\d+)\s*(?:pcs|units?|x|×)/i);
    const priceMatch = line.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:EGP|USD|EUR|LE)?/g);

    if (qtyMatch || priceMatch) {
      const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
      const prices = priceMatch ? priceMatch.map((p) => parseFloat(p.replace(/,/g, ""))) : [0];
      const unitPrice = prices.length > 1 ? prices[prices.length - 2] : prices[0] || 0;

      // Description = line minus numeric tail
      let description = line.replace(/(?:qty|quantity)[:\s]*\d+/gi, "").trim();
      description = description.replace(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, "").trim();

      if (description.length > 5) {
        parsedItems.push({
          id: itemId++,
          equipmentMoldType: description.slice(0, 120),
          technicalSpecs: detectMaterialSpec(line),
          machineCompatibility: detectMachineBrand(line),
          quantity: qty,
          unitPrice,
          totalPrice: qty * unitPrice,
        });
      }
    }
  }

  // If no items parsed, inject mock rows from keywords found in PDF
  if (parsedItems.length === 0) {
    const keywords = ["mold", "qaleb", "إسط", "قالب", "hardox", "carburiz", "zenith", "hess", "masa", "interlock", "curbstone", "production line", "خط"];
    const hasIndustrial = keywords.some((k) => text.toLowerCase().includes(k));

    if (hasIndustrial) {
      parsedItems.push({
        id: 1,
        equipmentMoldType: extractFirstMatchingLine(text, /mold|qaleb|إسط|قالب|block|line|خط/i) || "Industrial Equipment / Mold (extracted from PDF)",
        technicalSpecs: detectMaterialSpec(text) || "Carburized High-Tensile Steel, Heat-Treated",
        machineCompatibility: detectMachineBrand(text) || "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      });
    }
  }

  if (parsedItems.length > 0) base.items = parsedItems;

  // ─── Commercial terms ──────────────────────────────────────────────────────
  const deliveryMatch = text.match(/(?:delivery|lead time)[:\s]+([^\n]+)/i);
  const paymentMatch = text.match(/(?:payment terms?)[:\s]+([^\n]+)/i);
  const warrantyMatch = text.match(/(?:warranty)[:\s]+([^\n]+)/i);
  const validityMatch = text.match(/(?:valid(?:ity)?)[:\s]+([^\n]+)/i);

  if (deliveryMatch) base.commercial.deliveryTimeline = deliveryMatch[1].trim();
  if (paymentMatch) base.commercial.paymentTerms = paymentMatch[1].trim();
  if (warrantyMatch) base.commercial.warrantyCertification = warrantyMatch[1].trim();
  if (validityMatch) base.commercial.validity = validityMatch[1].trim();

  base.parseMeta = {
    source: "pdf-extraction",
    rawTextLength: text.length,
    itemsDetected: parsedItems.length,
    extractedAt: new Date().toISOString(),
  };

  return computeTotals(base);
}

function detectMaterialSpec(text) {
  const specs = [];
  if (/carburiz/i.test(text)) specs.push("Carburized High-Tensile Steel");
  if (/hardox\s*\d*/i.test(text)) specs.push("Hardox Steel");
  if (/heat[- ]?treat/i.test(text) || /hrc\s*\d+/i.test(text)) specs.push("Heat-Treated HRC 58–62");
  if (/1\.\d\s*mm/i.test(text)) specs.push("Case depth per spec");
  return specs.join(", ") || "";
}

function detectMachineBrand(text) {
  const brands = ["Zenith", "Hess", "Masa"];
  return brands.filter((b) => new RegExp(b, "i").test(text)).join(", ");
}

function extractFirstMatchingLine(text, pattern) {
  const line = text.split("\n").find((l) => pattern.test(l));
  return line?.trim().slice(0, 120) || "";
}

export { createEmptyItem };
