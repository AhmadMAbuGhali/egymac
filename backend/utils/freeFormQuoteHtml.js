import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BRAND_PRIMARY } from "../../shared/brandColors.js";
import { getEmbeddedCairoFontCss } from "./printFonts.js";
import { isSectionVisible } from "./quoteSectionVisibility.js";
import { resolveFixedSignaturesForQuote } from "./fixedSignatureBlock.js";
import { renderClassicFixedSignatures } from "./signatureHtml.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRINT_CSS_PATH = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "styles",
  "freeFormQuote.print.css"
);

const LOGO_CANDIDATES = [
  path.join(__dirname, "..", "assets", "logo.png"),
  path.join(__dirname, "..", "..", "frontend", "public", "logo.png"),
];

const LTR_CHUNK_RE =
  /(\+[0-9][0-9\s\-]*|[0-9]+(?:[.,][0-9]+)?%?|[0-9]+(?:\s*[×xX]\s*[0-9]+)+|[A-Za-z][A-Za-z0-9\s\-./\\]*)/g;

const TH_STYLE = `background-color:${BRAND_PRIMARY};color:#ffffff;font-family:Cairo,sans-serif;border-color:#2e6569;`;

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isMostlyLatin(text) {
  if (!text?.trim()) return false;
  const latin = (text.match(/[A-Za-z0-9×xX]/g) || []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return latin > arabic;
}

function isLtrChunk(part) {
  return /^(\+?\d|[A-Za-z]|[0-9]+\s*[×xX])/.test(String(part).trim());
}

/** Mirrors frontend MixedBidiText */
function renderBidiHtml(text, fallback = "—") {
  if (!text?.trim()) {
    return `<span dir="rtl" class="offer-align-ar">${esc(fallback)}</span>`;
  }

  const parts = String(text).split(LTR_CHUNK_RE).filter((p) => p !== "");
  const hasMixed = parts.some(isLtrChunk) && parts.some((p) => !isLtrChunk(p));

  if (!hasMixed) {
    if (isMostlyLatin(text)) {
      return `<span dir="ltr" class="inline-block offer-ltr-isolate offer-align-en">${esc(text)}</span>`;
    }
    return `<span dir="rtl" class="offer-align-ar">${esc(text)}</span>`;
  }

  return `<span class="offer-mixed-line" dir="rtl">${parts
    .map((part) =>
      isLtrChunk(part)
        ? `<span dir="ltr" class="inline-block offer-ltr-isolate">${esc(part)}</span>`
        : `<span dir="rtl" class="offer-ar-chunk">${esc(part)}</span>`
    )
    .join("")}</span>`;
}

function nl2brBidi(text) {
  if (!text?.trim()) return "";
  return String(text)
    .split("\n")
    .map((line) => renderBidiHtml(line.trim()))
    .join("<br/>");
}

function logoDataUri() {
  for (const p of LOGO_CANDIDATES) {
    try {
      if (fs.existsSync(p)) {
        return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
      }
    } catch {
      /* try next */
    }
  }
  return "";
}

function loadPrintCss() {
  try {
    return fs.readFileSync(PRINT_CSS_PATH, "utf8");
  } catch {
    return "";
  }
}

function sigGridClass(count) {
  const n = Math.max(1, Math.min(count || 1, 6));
  return `grid-cols-${n}`;
}

function renderSectionTitle(title, fallbackAr, fallbackEn) {
  const raw = title || `${fallbackAr} / ${fallbackEn}`;
  const style = `border-bottom:2px solid ${BRAND_PRIMARY};color:${BRAND_PRIMARY};font-family:Cairo,sans-serif;`;

  if (!raw.includes("/")) {
    const align = isMostlyLatin(raw) ? "offer-align-en" : "offer-align-ar";
    const dir = isMostlyLatin(raw) ? "ltr" : "rtl";
    return `<h2 class="offer-section-title" style="${style}"><span dir="${dir}" class="${align}">${esc(raw)}</span></h2>`;
  }

  const [arPart, ...rest] = raw.split("/");
  const enPart = rest.join("/").trim() || fallbackEn;

  return `<h2 class="offer-section-title" style="${style}">
    <span dir="rtl" class="offer-align-ar offer-section-ar">${esc(arPart.trim())}</span>
    <span dir="ltr" class="offer-align-en offer-section-en">${esc(enPart)}</span>
  </h2>`;
}

function thAlignClass(label, column) {
  if (column === "serial") return "offer-align-center";
  return isMostlyLatin(label) ? "offer-align-en" : "offer-align-ar";
}

function thColClass(column) {
  if (column === "serial") return "offer-col-serial offer-th-serial";
  if (column === "item") return "offer-col-item offer-th-item";
  return "offer-col-desc offer-th-desc";
}

function renderTableHeader(label, column) {
  const fallback = column === "serial" ? "م" : "—";
  return `<th class="brand-bg ${thColClass(column)} ${thAlignClass(label, column)}" style="${TH_STYLE}">${renderBidiHtml(label, fallback)}</th>`;
}

function tdAlignClass(text, column) {
  if (column === "serial") return "offer-align-center";
  return isMostlyLatin(text) ? "offer-align-en" : "offer-align-ar";
}

function tdColClass(column) {
  if (column === "serial") return "offer-col-serial";
  if (column === "item") return "offer-col-item";
  return "offer-col-desc";
}

function renderTableCell(text, column, fallback = "—") {
  const colClass = tdColClass(column);
  const alignClass = tdAlignClass(text, column);
  const arClass = column !== "serial" ? " offer-td-ar" : "";

  if (column === "serial") {
    return `<td class="${colClass} ${alignClass}"><span dir="ltr" class="inline-block offer-ltr-isolate">${esc(text || fallback)}</span></td>`;
  }

  return `<td class="${colClass} ${alignClass}${arClass}">${renderBidiHtml(text, fallback)}</td>`;
}

function renderTable(columns, rows, mapRow) {
  const body = (rows || [])
    .map((row, idx) => {
      const { desc, item, serial } = mapRow(row, idx);
      return `<tr>
        ${renderTableCell(desc, "desc")}
        ${renderTableCell(item, "item")}
        ${renderTableCell(serial || String(idx + 1), "serial")}
      </tr>`;
    })
    .join("");

  return `<table class="offer-table offer-table-premium" dir="ltr">
    <colgroup>
      <col class="offer-col-desc" style="width:45%" />
      <col class="offer-col-item" style="width:45%" />
      <col class="offer-col-serial" style="width:10%" />
    </colgroup>
    <thead>
      <tr class="brand-bg" style="${TH_STYLE}">
        ${renderTableHeader(columns.value || columns.termValue || "الوصف", "desc")}
        ${renderTableHeader(columns.parameter || columns.termKey || "البند", "item")}
        ${renderTableHeader(columns.serial || "م", "serial")}
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function renderSignatures(quote) {
  const blocks = resolveFixedSignaturesForQuote(quote);
  return renderClassicFixedSignatures(blocks);
}

function renderFooter(footer, compact) {
  const f = footer || {};
  const compactClass = compact ? " offer-document-footer--compact" : "";
  const extras = (f.extraLines || [])
    .filter(Boolean)
    .map((line) => `<p class="offer-footer-extra offer-align-center">${renderBidiHtml(line)}</p>`)
    .join("");

  return `<footer class="offer-document-footer offer-footer-anchored${compactClass}" style="border-top:2px solid ${BRAND_PRIMARY};background-color:#e9f3f4;">
    <div class="offer-footer-rule" style="background-color:${BRAND_PRIMARY};height:2px;max-width:4rem;margin:0 auto 0.625rem;"></div>
    ${f.companyName ? `<p class="offer-footer-brand offer-align-center">${renderBidiHtml(f.companyName)}</p>` : ""}
    <div class="offer-footer-grid">
      <div class="offer-footer-col offer-footer-col--en">
        ${f.headquartersEn ? `<p class="offer-footer-line offer-align-en">${esc(f.headquartersEn)}</p>` : ""}
        ${f.factoryEn ? `<p class="offer-footer-line offer-align-en">${esc(f.factoryEn)}</p>` : ""}
      </div>
      <div class="offer-footer-col offer-footer-col--ar">
        ${f.headquartersAr ? `<p class="offer-footer-line offer-align-ar"><span dir="rtl">${esc(f.headquartersAr)}</span></p>` : ""}
        ${f.factoryAr ? `<p class="offer-footer-line offer-align-ar"><span dir="rtl">${esc(f.factoryAr)}</span></p>` : ""}
      </div>
    </div>
    ${
      f.website || f.phone
        ? `<p class="offer-footer-contact offer-align-center">
            ${f.website ? `<span dir="ltr" class="inline-block offer-ltr-isolate">${esc(f.website)}</span>` : ""}
            ${f.website && f.phone ? `<span class="offer-footer-dot">·</span>` : ""}
            ${f.phone ? `<span dir="ltr" class="inline-block offer-ltr-isolate offer-footer-phone" style="color:${BRAND_PRIMARY};font-weight:700;">${esc(f.phone)}</span>` : ""}
          </p>`
        : ""
    }
    ${extras}
  </footer>`;
}

function buildPdfBaseCss() {
  return `
  ${getEmbeddedCairoFontCss()}

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .quotation-print-wrapper {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
  }

  #quotation-print-area {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    text-rendering: optimizeLegibility;
    font-feature-settings: "liga" 1, "calt" 1;
  }

  .offer-sheet-brand {
    gap: 0.875rem;
    margin-bottom: 1.25rem;
  }
`;
}

/** Force centered brand header in PDF (overrides offer-align-en left align) */
function buildPdfBrandCenterCss() {
  return `
  #quotation-print-area .offer-sheet-brand,
  #quotation-print-area .offer-sheet-brand-text {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    width: 100% !important;
  }

  #quotation-print-area .offer-sheet-company,
  #quotation-print-area .offer-sheet-tagline {
    text-align: center !important;
    width: 100% !important;
    margin-inline: auto !important;
  }

  #quotation-print-area .offer-sheet-brand .offer-align-en,
  #quotation-print-area .offer-sheet-brand .offer-align-ar,
  #quotation-print-area .offer-sheet-brand .offer-ltr-isolate {
    text-align: center !important;
  }

  #quotation-print-area .offer-sheet-tagline {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0.125rem 0.35rem !important;
  }
`;
}

/** Loaded after shared print CSS so PDF logo size always wins */
function buildPdfLogoCss(printMode) {
  const compact = printMode === "compact";
  const height = compact ? "6.5rem" : "8.5rem";
  const maxWidth = compact ? "16rem" : "22rem";

  return `
  #quotation-print-area .offer-sheet-logo {
    height: ${height} !important;
    width: auto !important;
    max-width: ${maxWidth} !important;
    min-height: ${height} !important;
    object-fit: contain !important;
    display: block !important;
    margin-inline: auto !important;
  }
`;
}

/**
 * Visual Offer Extension — additive section "المرفقات الفنية المصورة".
 * Returns "" when no attachments, leaving the standard offer output identical.
 * Only embedded data: URIs are accepted (uploads are Base64-encoded client-side).
 */
function renderVisualAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return "";

  const items = attachments
    .filter((a) => typeof a?.src === "string" && a.src.startsWith("data:image/"))
    .map(
      (a) => `<figure class="offer-visual-item">
        <img src="${a.src}" alt="${esc(a.caption || "Technical attachment")}" class="offer-visual-img" />
        ${a.caption ? `<figcaption class="offer-visual-caption offer-align-ar">${renderBidiHtml(a.caption)}</figcaption>` : ""}
      </figure>`
    )
    .join("");

  if (!items) return "";

  return `<section class="offer-section offer-print-block offer-visual-attachments">
    ${renderSectionTitle("المرفقات الفنية المصورة / Visual Technical Attachments", "المرفقات الفنية المصورة", "Visual Technical Attachments")}
    <div class="offer-visual-grid">${items}</div>
  </section>`;
}

/**
 * Build HTML document — same structure & CSS as Live Official Preview.
 */
export function buildFreeFormQuoteHtml(quote, printMode = "spanned") {
  const logo = logoDataUri();
  const compact = printMode === "compact";
  const modeClass = compact ? "print-mode-compact" : "print-mode-spanned";
  const techCols = quote.technicalColumns || {};
  const commCols = quote.commercialColumns || {};
  const printCss = loadPrintCss();
  const logoHeight = compact ? "6.5rem" : "8.5rem";

  const customTitle =
    isSectionVisible(quote, "documentMeta") &&
    quote.documentTitle &&
    quote.documentTitle !== "عرض سعر / Price Offer"
      ? `<p class="offer-meta-subtitle offer-align-ar">${renderBidiHtml(quote.documentTitle)}</p>`
      : "";

  const metaBlock = isSectionVisible(quote, "documentMeta")
    ? `<div class="offer-meta-block offer-section-banner" style="background-color:#e9f3f4;border:1px solid ${BRAND_PRIMARY};">
          <p class="offer-meta-title" style="color:${BRAND_PRIMARY};font-family:Cairo,sans-serif;">
            <span class="offer-align-en offer-meta-en">PRICE OFFER</span>
            <span class="offer-meta-sep">/</span>
            <span class="offer-align-ar offer-meta-ar"><span dir="rtl">عرض سعر</span></span>
          </p>
          ${customTitle}
          <div class="offer-meta-row">
            <p class="offer-align-en">
              <span class="offer-meta-label">Reference</span>
              <span dir="ltr" class="inline-block offer-meta-value offer-ltr-isolate">${esc(quote.referenceNumber || "—")}</span>
            </p>
            <p class="offer-align-en">
              <span class="offer-meta-label">Date</span>
              <span dir="ltr" class="inline-block offer-meta-value offer-ltr-isolate">${esc(quote.date || "—")}</span>
            </p>
          </div>
        </div>`
    : "";

  const intro =
    isSectionVisible(quote, "greeting") && (quote.clientName || quote.greeting)
      ? `<section class="offer-intro offer-print-block">
          ${
            quote.clientName
              ? `<p class="offer-client offer-align-ar"><span dir="rtl">السادة: <strong>${renderBidiHtml(quote.clientName)}</strong></span></p>`
              : ""
          }
          ${
            quote.greeting
              ? `<p class="offer-greeting offer-align-ar">${nl2brBidi(quote.greeting)}</p>`
              : ""
          }
        </section>`
      : "";

  const techSection = isSectionVisible(quote, "technicalSpecs")
    ? `<section class="offer-section offer-print-table-wrap">
          ${renderSectionTitle(quote.technicalSectionTitle, "المواصفات الفنية", "Technical Specifications")}
          ${renderTable(techCols, quote.technicalSpecs, (r, i) => ({
            desc: r.value,
            item: r.parameter,
            serial: r.serial || String(i + 1),
          }))}
        </section>`
    : "";

  const commSection = isSectionVisible(quote, "commercialTerms")
    ? `<section class="offer-section offer-print-table-wrap">
          ${renderSectionTitle(quote.commercialSectionTitle, "الشروط التجارية", "Commercial Terms")}
          ${renderTable(commCols, quote.commercialTerms, (r, i) => ({
            desc: r.termValue,
            item: r.termKey,
            serial: r.serial || String(i + 1),
          }))}
        </section>`
    : "";

  const visualSection = isSectionVisible(quote, "visualAttachments")
    ? renderVisualAttachments(quote.visualAttachments)
    : "";

  const closingBlock =
    isSectionVisible(quote, "closingNote") && quote.closingNote
      ? `<section class="offer-closing offer-print-closing offer-print-block">
                  <p class="offer-align-ar">${renderBidiHtml(quote.closingNote)}</p>
                </section>`
      : "";

  const sigBlock = isSectionVisible(quote, "signatures") ? renderSignatures(quote) : "";
  const footerBlock = isSectionVisible(quote, "companyFooter")
    ? renderFooter(quote.companyFooter, compact)
    : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EGY MAC Quotation</title>
  <style>
    ${buildPdfBaseCss()}
    ${printCss}
    ${buildPdfBrandCenterCss()}
    ${buildPdfLogoCss(printMode)}
  </style>
</head>
<body>
  <div class="quotation-print-wrapper">
    <article
      id="quotation-print-area"
      dir="ltr"
      class="offer-document offer-print-document offer-sheet offer-doc-ltr ${modeClass}"
      data-print-mode="${compact ? "compact" : "spanned"}"
      style="background-color:#ffffff;font-family:Cairo,sans-serif;display:flex;flex-direction:column;${compact ? "min-height:297mm;" : ""}"
    >
      <div class="offer-sheet-accent brand-bg" style="background-color:${BRAND_PRIMARY};height:3px;flex-shrink:0;"></div>

      <header class="offer-sheet-header offer-print-block" style="flex-shrink:0;">
        <div class="offer-sheet-brand">
          ${logo ? `<img src="${logo}" alt="Egy Mac Machine" class="offer-sheet-logo" width="400" height="400" decoding="async" style="height:${logoHeight};width:auto;object-fit:contain;" />` : ""}
          <div class="offer-sheet-brand-text">
            <h1 class="offer-sheet-company" style="text-align:center;width:100%;">EGY MAC MACHINE</h1>
            <p class="offer-sheet-tagline" style="text-align:center;width:100%;display:flex;justify-content:center;flex-wrap:wrap;align-items:center;gap:0.25rem;">
              <span dir="ltr" class="inline-block offer-ltr-isolate">Fully Automated Lines · Custom Engineering</span>
              <span dir="rtl" class="offer-align-ar">· إيجي ماك</span>
            </p>
          </div>
        </div>

        ${metaBlock}
      </header>

      <div class="offer-document-body" style="flex:1 1 auto;display:flex;flex-direction:column;">
        ${intro}
        ${techSection}
        ${commSection}
        ${visualSection}

        <div class="offer-document-tail" style="margin-top:auto;flex-shrink:0;">
          ${closingBlock}
          ${sigBlock}
          ${footerBlock}
        </div>
      </div>
    </article>
  </div>
</body>
</html>`;
}

export function buildQuotationFilename(quote) {
  const sanitize = (value, fallback) => {
    const cleaned = String(value || fallback)
      .replace(/[\x00-\x1f\x7f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[/\\?%*:|"<>]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 64);
    return cleaned || fallback;
  };
  return `Egy_Mac_Quotation_${sanitize(quote.clientName, "Client")}.pdf`;
}

export function contentDispositionAttachment(filename, utf8Filename) {
  const ascii = String(filename)
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/\\/g, "_")
    .replace(/"/g, "_")
    .trim();

  const safeAscii = ascii || "Egy_Mac_Quotation.pdf";
  const utf8 = utf8Filename || filename;
  const encoded = encodeURIComponent(String(utf8)).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
}

export function buildQuotationFilenameUtf8(quote) {
  const sanitize = (value, fallback) => {
    const cleaned = String(value || fallback)
      .replace(/[\x00-\x1f\x7f]/g, "")
      .replace(/[/\\?%*:|"<>]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 64);
    return cleaned || fallback;
  };
  return `Egy_Mac_Quotation_${sanitize(quote.clientName, "Client")}.pdf`;
}
