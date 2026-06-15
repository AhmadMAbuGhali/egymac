/**
 * Heavy Machinery template — backend Puppeteer HTML builder
 * (templateStyle: 'machinery_detailed').
 * Sequential machinery assembly blocks modeled on the reference offer:
 * brand banner title (أولاً: …) → image beside dedicated spec table →
 * standalone price card, then the global financial matrix and the three
 * signature slots. Page skeleton (repeating header/footer + watermark)
 * mirrors the replica template via read-only CSS reuse. Fully additive.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BRAND_PRIMARY } from "../../shared/brandColors.js";
import { isSectionVisible } from "./quoteSectionVisibility.js";
import { getEmbeddedCairoFontCss } from "./printFonts.js";
import { resolveFixedSignaturesForQuote } from "./fixedSignatureBlock.js";
import { renderReplicaFixedSignatures } from "./signatureHtml.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STYLES_DIR = path.join(__dirname, "..", "..", "frontend", "src", "styles");
const REPLICA_CSS_PATH = path.join(STYLES_DIR, "replicaQuote.print.css");
const MACHINERY_CSS_PATH = path.join(STYLES_DIR, "machineryQuote.print.css");

const LOGO_CANDIDATES = [
  path.join(__dirname, "..", "assets", "logo.png"),
  path.join(__dirname, "..", "..", "frontend", "public", "logo.png"),
];

const MACHINERY_ORDINALS = [
  "أولاً",
  "ثانياً",
  "ثالثاً",
  "رابعاً",
  "خامساً",
  "سادساً",
  "سابعاً",
  "ثامناً",
  "تاسعاً",
  "عاشراً",
];

const LTR_CHUNK_RE =
  /(\+[0-9][0-9\s\-]*|[0-9]+(?:[.,][0-9]+)?%?|[0-9]+(?:\s*[×xX]\s*[0-9]+)+|[A-Za-z][A-Za-z0-9\s\-./\\]*)/g;

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

function bidi(text, fallback = "—") {
  if (!text?.trim()) {
    return `<span dir="rtl" class="offer-align-ar">${esc(fallback)}</span>`;
  }
  const parts = String(text).split(LTR_CHUNK_RE).filter((p) => p !== "");
  const hasMixed = parts.some(isLtrChunk) && parts.some((p) => !isLtrChunk(p));

  if (!hasMixed) {
    if (isMostlyLatin(text)) {
      return `<span dir="ltr" class="offer-ltr-isolate">${esc(text)}</span>`;
    }
    return `<span dir="rtl" class="offer-align-ar">${esc(text)}</span>`;
  }

  const chunks = parts
    .map((part) =>
      isLtrChunk(part)
        ? `<span dir="ltr" class="offer-ltr-isolate">${esc(part)}</span>`
        : `<span dir="rtl" class="offer-ar-chunk">${esc(part)}</span>`
    )
    .join("");
  return `<span class="offer-mixed-line" dir="rtl">${chunks}</span>`;
}

function loadCss(cssPath) {
  try {
    return fs.readFileSync(cssPath, "utf8");
  } catch {
    return "";
  }
}

function logoDataUri() {
  for (const candidate of LOGO_CANDIDATES) {
    try {
      const buffer = fs.readFileSync(candidate);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    } catch {
      // try next candidate
    }
  }
  return "";
}

const FOOTER_ICONS = {
  phone: `<svg class="rp-footer-icon" viewBox="0 0 24 24" fill="${BRAND_PRIMARY}"><circle cx="12" cy="12" r="11"/><path d="M16.6 14.4c-.5-.2-1.2-.6-1.6-.7-.3-.1-.6 0-.8.3l-.5.7c-.2.2-.4.2-.7.1-1-.5-2.1-1.5-2.7-2.5-.1-.3-.1-.5.1-.7l.6-.6c.2-.2.3-.5.2-.8-.1-.4-.5-1.2-.7-1.6-.2-.4-.5-.5-.9-.4l-1 .3c-.4.2-.7.6-.7 1 .1 1.6.9 3.5 2.4 5s3.4 2.3 5 2.4c.4 0 .8-.3 1-.7l.3-1c.1-.3 0-.7-.4-.8z" fill="#ffffff"/></svg>`,
  pin: `<svg class="rp-footer-icon" viewBox="0 0 24 24" fill="${BRAND_PRIMARY}"><circle cx="12" cy="12" r="11"/><path d="M12 5.5c-2.5 0-4.5 2-4.5 4.5 0 3.4 4.5 8.5 4.5 8.5s4.5-5.1 4.5-8.5c0-2.5-2-4.5-4.5-4.5zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4z" fill="#ffffff"/></svg>`,
  globe: `<svg class="rp-footer-icon" viewBox="0 0 24 24" fill="${BRAND_PRIMARY}"><circle cx="12" cy="12" r="11"/><path d="M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5.4 6.3h-2.5a11 11 0 0 0-.9-3.9 5.6 5.6 0 0 1 3.4 3.9zM12 6.5c.6.8 1.3 2.2 1.5 4.1h-3c.2-1.9.9-3.3 1.5-4.1zm-2 .9a11 11 0 0 0-.9 3.9H6.6A5.6 5.6 0 0 1 10 7.4zm-3.4 5.3h2.5c.1 1.5.4 2.8.9 3.9a5.6 5.6 0 0 1-3.4-3.9zm5.4 4.8c-.6-.8-1.3-2.2-1.5-4.1h3c-.2 1.9-.9 3.3-1.5 4.1zm2-.9c.5-1.1.8-2.4.9-3.9h2.5a5.6 5.6 0 0 1-3.4 3.9z" fill="#ffffff"/></svg>`,
};

function renderPageHeader(logo) {
  return `<header class="rp-page-header">
    ${logo ? `<img src="${logo}" alt="Egy Mac Machine" class="rp-header-logo" />` : ""}
    <h1 class="rp-header-company">EGY MAC Machine</h1>
    <p class="rp-header-tagline">Concrete Block Molds &amp; Industrial Machinery</p>
    <div class="rp-header-rule"></div>
  </header>`;
}

function renderPageFooter(footer) {
  const f = footer || {};
  const website = f.website
    ? f.website.startsWith("http")
      ? f.website
      : `https://${f.website}`
    : "";
  const extraRows = (f.extraLines || [])
    .filter(Boolean)
    .map((line) => `<div class="rp-footer-row"><span dir="rtl">${esc(line)}</span></div>`)
    .join("");

  return `<footer class="rp-page-footer">
    <div class="rp-footer-rows">
      ${f.phone ? `<div class="rp-footer-row">${FOOTER_ICONS.phone}<span dir="ltr">${esc(f.phone)}</span></div>` : ""}
      ${
        f.headquartersEn || f.factoryEn
          ? `<div class="rp-footer-row">${FOOTER_ICONS.pin}<span>${esc(f.headquartersEn || "")}${f.headquartersEn && f.factoryEn ? "<br/>" : ""}${esc(f.factoryEn || "")}</span></div>`
          : ""
      }
      ${website ? `<div class="rp-footer-row">${FOOTER_ICONS.globe}<span dir="ltr">${esc(website)}</span></div>` : ""}
      ${extraRows}
    </div>
    <div class="rp-footer-band"></div>
  </footer>`;
}

function isDataImage(src) {
  return typeof src === "string" && src.startsWith("data:image/");
}

function renderMachineryItem(item, index) {
  const ordinal = MACHINERY_ORDINALS[index] || `${index + 1} -`;
  const specs = (item.specs || [])
    .map(
      (spec) => `<tr>
        <td class="rp-cell-label">${bidi(spec.label)}</td>
        <td>${bidi(spec.value)}</td>
      </tr>`
    )
    .join("");

  const image = isDataImage(item.image)
    ? `<div class="mq-item-img-box"><img src="${item.image}" alt="${esc(item.imageCaption || item.title || "Machinery")}" /></div>`
    : "";

  return `<section class="mq-item">
    <div class="mq-item-banner">
      <span class="mq-item-ordinal">${esc(ordinal)}</span>
      <span class="mq-item-title">${bidi(item.title, "—")}</span>
    </div>
    <div class="mq-item-grid">
      <div class="mq-item-table-box">
        <table class="rp-table" dir="rtl">
          <thead>
            <tr>
              <th style="width:42%">Description</th>
              <th style="width:58%">Specification</th>
            </tr>
          </thead>
          <tbody>${specs}</tbody>
        </table>
        <div class="mq-price-card">
          <span class="mq-price-label">سعر البند / Item Price</span>
          <span class="mq-price-value">${esc(item.price || "—")}</span>
          ${item.priceNote ? `<span class="mq-price-note">${esc(item.priceNote)}</span>` : ""}
        </div>
      </div>
      ${image}
    </div>
  </section>`;
}

function renderFinancialMatrix(quote) {
  const commCols = quote.commercialColumns || {};
  const rows = (quote.commercialTerms || [])
    .map(
      (row, idx) => `<tr>
        <td class="rp-cell-label">${esc(row.serial || String(idx + 1))}</td>
        <td class="rp-cell-label">${bidi(row.termKey)}</td>
        <td class="rp-cell-value">${bidi(row.termValue)}</td>
      </tr>`
    )
    .join("");

  return `<h2 class="mq-financial-title">${esc(quote.commercialSectionTitle || "العرض المالي وشروط التعاقد")}</h2>
  <table class="rp-table rp-commercial-table" dir="rtl">
    <colgroup>
      <col class="rp-col-serial" />
      <col class="rp-col-key" />
      <col class="rp-col-value" />
    </colgroup>
    <thead>
      <tr>
        <th>${esc(commCols.serial || "م")}</th>
        <th>${esc(commCols.termKey || "البند")}</th>
        <th>${esc(commCols.termValue || "التفاصيل و الشروط")}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderSignatures(quote) {
  const blocks = resolveFixedSignaturesForQuote(quote);
  return renderReplicaFixedSignatures(blocks, bidi);
}

export function buildMachineryQuoteHtml(quote, printMode = "spanned") {
  const logo = logoDataUri();
  const mode = printMode === "compact" ? "compact" : "spanned";
  const css = `${loadCss(REPLICA_CSS_PATH)}\n${loadCss(MACHINERY_CSS_PATH)}`;

  const items = Array.isArray(quote.machineryItems) ? quote.machineryItems : [];
  const greetingLines = String(quote.greeting || "").split("\n");
  const greetingFirst = greetingLines[0] || "";
  const greetingRest = greetingLines.slice(1).join("\n").trim();
  const show = (key) => isSectionVisible(quote, key);

  const docTitleBlock =
    show("documentMeta") && quote.documentTitle
      ? `<p class="rp-doc-title"><span dir="rtl">${bidi(quote.documentTitle)}</span></p>`
      : "";

  const metaBlock = show("documentMeta")
    ? `<div class="rp-meta">
                  <p><span class="rp-meta-label">التاريخ : </span><span class="rp-meta-value" dir="ltr">${esc(quote.date || "—")}</span></p>
                  <p><span class="rp-meta-label">السادة : </span><span class="rp-meta-value">${bidi(quote.clientName)}</span></p>
                  <p><span class="rp-meta-label">رقم المرجعي : </span><span class="rp-meta-value" dir="ltr">${esc(quote.referenceNumber || "—")}</span></p>
                </div>`
    : "";

  const greetingBlock = show("greeting")
    ? `${greetingFirst ? `<p class="rp-greeting-line">${esc(greetingFirst)}</p>` : ""}
                ${greetingRest ? `<p class="rp-greeting-body">${esc(greetingRest)}</p>` : ""}`
    : "";

  const machineryBlock = show("machineryItems")
    ? items.map((item, index) => renderMachineryItem(item, index)).join("\n")
    : "";

  const commBlock = show("commercialTerms") ? renderFinancialMatrix(quote) : "";
  const closingBlock =
    show("closingNote") && quote.closingNote ? `<p class="rp-note">${bidi(quote.closingNote)}</p>` : "";
  const sigBlock = show("signatures") ? renderSignatures(quote) : "";
  const pageFooter = show("companyFooter") ? renderPageFooter(quote.companyFooter) : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EGY MAC Quotation</title>
  <style>
    ${getEmbeddedCairoFontCss()}

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      -webkit-font-smoothing: antialiased;
    }

    ${css}
  </style>
</head>
<body>
  <div class="replica-print-wrapper">
    <article id="replica-print-area" dir="rtl" class="print-mode-${mode}" data-print-mode="${mode}">
      <div class="rp-watermark">${logo ? `<img src="${logo}" alt="" />` : ""}</div>

      <table class="rp-doc-table">
        <thead>
          <tr><td>${renderPageHeader(logo)}</td></tr>
        </thead>
        <tfoot>
          <tr><td>${pageFooter}</td></tr>
        </tfoot>
        <tbody>
          <tr>
            <td class="rp-body-cell">
              <div class="rp-body-inner">
                ${docTitleBlock}
                ${metaBlock}
                ${greetingBlock}
                ${machineryBlock}
                ${commBlock}
                ${closingBlock}
                ${sigBlock}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>
</body>
</html>`;
}
