import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { computeTotals } from "./quotationTemplate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

const BRAND = "#3B767C";
const INK = "#333333";
const BODY = "#52585A";
const BORDER = "#E5E7EB";

/**
 * Generates a professional Egy Mac Price Offer PDF buffer via PDFKit.
 */
export function generateQuotationPdf(quotationData) {
  const q = computeTotals(quotationData);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100;

    // ─── Header with orange accent bar ───────────────────────────────────────
    doc.rect(50, 45, pageWidth, 4).fill(BRAND);

    // Logo
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 50, 55, { width: 70 });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(INK)
      .text("EGY MAC MACHINE", 130, 58, { align: "left" });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(BODY)
      .text("Fully Automated Lines · Custom Fabrication · Repair · Egypt", 130, 80);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(BRAND)
      .text("PRICE OFFER / عرض سعر", 50, 115, { align: "right", width: pageWidth });

    doc.moveDown(0.5);

    // ─── Reference block ─────────────────────────────────────────────────────
    const metaY = 140;
    doc.font("Helvetica").fontSize(9).fillColor(BODY);
    doc.text(`Reference: ${q.referenceNumber || "—"}`, 50, metaY);
    doc.text(`Date: ${q.date || "—"}`, 50, metaY, { align: "right", width: pageWidth });

    doc.moveTo(50, metaY + 18).lineTo(50 + pageWidth, metaY + 18).strokeColor(BORDER).stroke();

    // ─── Client info ─────────────────────────────────────────────────────────
    let y = metaY + 30;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text("CLIENT INFORMATION", 50, y);
    y += 16;

    const clientRows = [
      ["Company", q.client?.companyName || "—"],
      ["Project Location", q.client?.projectLocation || "—"],
      ["Attention To", q.client?.attentionTo || "—"],
    ];

    doc.font("Helvetica").fontSize(9).fillColor(BODY);
    for (const [label, value] of clientRows) {
      doc.font("Helvetica-Bold").fillColor(INK).text(`${label}:`, 50, y, { continued: true, width: 120 });
      doc.font("Helvetica").fillColor(BODY).text(`  ${value}`, { width: pageWidth - 120 });
      y += 14;
    }

    y += 10;

    // ─── Items table ─────────────────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text("ENGINEERING & FABRICATION ITEMS", 50, y);
    y += 14;

    const cols = { svc: 50, type: 95, scope: 195, specs: 300, hrs: 395, qty: 425, unit: 455, total: 500 };
    const colW = { svc: 42, type: 95, scope: 100, specs: 90, hrs: 25, qty: 25, unit: 40, total: 45 };

    doc.rect(50, y, pageWidth, 18).fill("#F3F4F6");
    doc.font("Helvetica-Bold").fontSize(5.5).fillColor(INK);
    doc.text("SERVICE", cols.svc + 2, y + 5, { width: colW.svc });
    doc.text("ITEM", cols.type, y + 5, { width: colW.type });
    doc.text("SCOPE", cols.scope, y + 5, { width: colW.scope });
    doc.text("SPECS", cols.specs, y + 5, { width: colW.specs });
    doc.text("HRS", cols.hrs, y + 5, { width: colW.hrs });
    doc.text("QTY", cols.qty, y + 5, { width: colW.qty });
    doc.text("UNIT", cols.unit, y + 5, { width: colW.unit });
    doc.text("TOTAL", cols.total, y + 5, { width: colW.total });
    y += 18;

    doc.font("Helvetica").fontSize(6.5).fillColor(BODY);

    for (const item of q.items || []) {
      if (y > 620) { doc.addPage(); y = 50; }

      const svc = (item.serviceCategory || "custom").replace(/-/g, " ").slice(0, 12);
      const type = item.equipmentMoldType || item.description || "—";
      const scope = item.scopeOfWork || "—";
      const specs = item.technicalSpecs || item.materialSpec || "—";
      const hrs = item.laborHours ? String(item.laborHours) : "—";

      const rowH = Math.max(
        22,
        doc.heightOfString(type, { width: colW.type }) + 8,
        doc.heightOfString(scope, { width: colW.scope }) + 8
      );

      doc.rect(50, y, pageWidth, rowH).strokeColor(BORDER).stroke();
      doc.text(svc, cols.svc + 2, y + 4, { width: colW.svc });
      doc.text(type, cols.type, y + 4, { width: colW.type });
      doc.text(scope, cols.scope, y + 4, { width: colW.scope });
      doc.text(specs, cols.specs, y + 4, { width: colW.specs });
      doc.text(hrs, cols.hrs, y + 4, { width: colW.hrs });
      doc.text(String(item.quantity ?? "—"), cols.qty, y + 4, { width: colW.qty });
      doc.text(formatMoney(item.unitPrice, q.currency), cols.unit, y + 4, { width: colW.unit });
      doc.font("Helvetica-Bold").fillColor(BRAND);
      doc.text(formatMoney(item.totalPrice, q.currency), cols.total, y + 4, { width: colW.total });
      doc.font("Helvetica").fillColor(BODY);

      y += rowH;
    }

    y += 8;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
    doc.text("GRAND TOTAL:", cols.unit - 20, y, { width: 80, align: "right" });
    doc.fillColor(BRAND).text(formatMoney(q.grandTotal, q.currency), cols.total, y, { width: colW.total });
    y += 24;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text("COMMERCIAL TERMS", 50, y);
    y += 14;

    const terms = [
      ["Production / Delivery", q.commercial?.deliveryTimeline || q.commercial?.deliveryTime],
      ["Payment Terms", q.commercial?.paymentTerms],
      ["German Tech Warranty", q.commercial?.warrantyCertification || q.commercial?.warrantyPeriod],
      ["Offer Validity", q.commercial?.validity],
    ];

    doc.font("Helvetica").fontSize(9).fillColor(BODY);
    for (const [label, value] of terms) {
      doc.font("Helvetica-Bold").fillColor(INK).text(`${label}:`, 50, y, { continued: true });
      doc.font("Helvetica").fillColor(BODY).text(` ${value || "—"}`);
      y += 13;
    }

    if (q.notes) {
      y += 6;
      doc.font("Helvetica-Bold").fillColor(INK).text("Notes:", 50, y);
      y += 12;
      doc.font("Helvetica").fillColor(BODY).text(q.notes, 50, y, { width: pageWidth });
      y += doc.heightOfString(q.notes, { width: pageWidth }) + 10;
    }

    // ─── Footer / signature block ────────────────────────────────────────────
    const footerY = Math.max(y + 30, 680);
    doc.moveTo(50, footerY).lineTo(50 + pageWidth, footerY).strokeColor(BRAND).lineWidth(2).stroke();

    doc.font("Helvetica").fontSize(8).fillColor(BODY);
    doc.text("Authorized Signature", 50, footerY + 12);
    doc.text("_________________________", 50, footerY + 28);
    doc.text("Egy Mac Machine — Sales & Engineering Dept.", 50, footerY + 44);

    doc.text("Client Acceptance", 320, footerY + 12);
    doc.text("_________________________", 320, footerY + 28);
    doc.text("Name / Title / Date", 320, footerY + 44);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#9CA3AF")
      .text(
        "This document is a commercial price offer generated by Egy Mac B2B system. German Precision, Egyptian Might.",
        50,
        footerY + 70,
        { align: "center", width: pageWidth }
      );

    doc.end();
  });
}

function formatMoney(amount, currency = "EGP") {
  const n = Number(amount) || 0;
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
