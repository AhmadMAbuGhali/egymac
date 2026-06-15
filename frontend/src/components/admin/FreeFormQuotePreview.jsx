import { resolveFixedSignatures } from "../../constants/signatures.js";
import { PRINT_MODE_COMPACT } from "./PrintOptimizerBar.jsx";
import OfferDocumentFooter from "../OfferDocumentFooter.jsx";
import {
  META_BANNER_STYLE,
  TH_INLINE_STYLE,
  BRAND_PRIMARY,
} from "../../constants/offerPrintStyles.js";
import VisualAttachmentsSection from "./VisualAttachmentsSection.jsx";
import { isSectionVisible } from "../../constants/quoteSectionVisibility.js";
import {
  EditableText,
  EditableTableCell,
  EditableTableHeader,
  EditableSectionTitle,
} from "./inlineEdit.jsx";

/**
 * Live official preview — PDF export uses backend Puppeteer (native Arabic RTL).
 * `visualAttachments` is an optional additive layer (Visual Offer Extension);
 * when null/empty the document renders exactly as the original standard offer.
 */
export default function FreeFormQuotePreview({
  quote,
  printMode = "spanned",
  visualAttachments = null,
  sectionVisibility = null,
}) {
  const cols = quote.commercialColumns || {};
  const techCols = quote.technicalColumns || {};
  const sigBlocks = resolveFixedSignatures(quote);
  const isCompact = printMode === PRINT_MODE_COMPACT;
  const vis = sectionVisibility ?? quote.sectionVisibility;
  const show = (key) => isSectionVisible(vis, key);

  return (
    <div className="quotation-print-wrapper">
      <article
        id="quotation-print-area"
        dir="ltr"
        className={`offer-document offer-print-document offer-sheet offer-doc-ltr print-mode-${printMode}`}
        data-print-mode={printMode}
        style={{
          backgroundColor: "#ffffff",
          fontFamily: "Cairo, sans-serif",
          display: "flex",
          flexDirection: "column",
          minHeight: isCompact ? "297mm" : "auto",
        }}
      >
        <div
          className="offer-sheet-accent brand-bg"
          aria-hidden
          style={{ backgroundColor: BRAND_PRIMARY, height: "3px", flexShrink: 0 }}
        />

        <header className="offer-sheet-header offer-print-block" style={{ flexShrink: 0 }}>
          <div className="offer-sheet-brand">
            <img
              src="/logo.png"
              alt="Egy Mac Machine"
              className="offer-sheet-logo"
              width={256}
              height={256}
              decoding="async"
              crossOrigin="anonymous"
            />
            <div className="offer-sheet-brand-text">
              <h1 className="offer-sheet-company">EGY MAC MACHINE</h1>
              <p className="offer-sheet-tagline">
                <span dir="ltr" className="inline-block offer-ltr-isolate">
                  Fully Automated Lines · Custom Engineering
                </span>
                <span dir="rtl" className="offer-align-ar">
                  · إيجي ماك
                </span>
              </p>
            </div>
          </div>

          {show("documentMeta") && (
          <div className="offer-meta-block offer-section-banner" style={META_BANNER_STYLE}>
            <p
              className="offer-meta-title"
              style={{ color: BRAND_PRIMARY, fontFamily: "Cairo, sans-serif" }}
            >
              <span className="offer-align-en offer-meta-en">PRICE OFFER</span>
              <span className="offer-meta-sep" aria-hidden>
                /
              </span>
              <span className="offer-align-ar offer-meta-ar">
                <span dir="rtl">عرض سعر</span>
              </span>
            </p>
            {quote.documentTitle && quote.documentTitle !== "عرض سعر / Price Offer" && (
              <p className="offer-meta-subtitle offer-align-ar">
                <EditableText path="field.documentTitle" text={quote.documentTitle} dirHint="rtl" />
              </p>
            )}
            <div className="offer-meta-row">
              <p className="offer-align-en">
                <span className="offer-meta-label">Reference</span>
                <span dir="ltr" className="inline-block offer-meta-value offer-ltr-isolate">
                  <EditableText path="field.referenceNumber" text={quote.referenceNumber} dirHint="ltr" />
                </span>
              </p>
              <p className="offer-align-en">
                <span className="offer-meta-label">Date</span>
                <span dir="ltr" className="inline-block offer-meta-value offer-ltr-isolate">
                  <EditableText path="field.date" text={quote.date} dirHint="ltr" />
                </span>
              </p>
            </div>
          </div>
          )}
        </header>

        <div
          className="offer-document-body"
          style={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}
        >
          {show("greeting") && (quote.clientName || quote.greeting) && (
            <section className="offer-intro offer-print-block">
              {quote.clientName && (
                <p className="offer-client offer-align-ar font-bold">
                  <span dir="rtl">
                    السادة:{" "}
                    <strong>
                      <EditableText path="field.clientName" text={quote.clientName} dirHint="rtl" />
                    </strong>
                  </span>
                </p>
              )}
              {quote.greeting && (
                <p className="offer-greeting offer-align-ar">
                  <EditableText path="field.greeting" text={quote.greeting} block dirHint="rtl" />
                </p>
              )}
            </section>
          )}

          {show("technicalSpecs") && (
          <section className="offer-section offer-print-table-wrap">
            <EditableSectionTitle
              path="field.technicalSectionTitle"
              title={quote.technicalSectionTitle}
              fallbackAr="المواصفات الفنية"
              fallbackEn="Technical Specifications"
            />
            <table className="offer-table offer-table-premium" dir="ltr">
              <colgroup>
                <col className="offer-col-desc" style={{ width: "45%" }} />
                <col className="offer-col-item" style={{ width: "45%" }} />
                <col className="offer-col-serial" style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="brand-bg" style={TH_INLINE_STYLE}>
                  <EditableTableHeader path="techCol.value" label={techCols.value} column="desc" />
                  <EditableTableHeader path="techCol.parameter" label={techCols.parameter} column="item" />
                  <EditableTableHeader path="techCol.serial" label={techCols.serial || "م"} column="serial" />
                </tr>
              </thead>
              <tbody>
                {quote.technicalSpecs.map((row, idx) => (
                  <tr key={row.id}>
                    <EditableTableCell path={`spec.${row.id}.value`} text={row.value} column="desc" />
                    <EditableTableCell path={`spec.${row.id}.parameter`} text={row.parameter} column="item" />
                    <EditableTableCell
                      path={`spec.${row.id}.serial`}
                      text={row.serial || String(idx + 1)}
                      column="serial"
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          )}

          {show("commercialTerms") && (
          <section className="offer-section offer-print-table-wrap">
            <EditableSectionTitle
              path="field.commercialSectionTitle"
              title={quote.commercialSectionTitle}
              fallbackAr="الشروط التجارية"
              fallbackEn="Commercial Terms"
            />
            <table className="offer-table offer-table-premium" dir="ltr">
              <colgroup>
                <col className="offer-col-desc" style={{ width: "45%" }} />
                <col className="offer-col-item" style={{ width: "45%" }} />
                <col className="offer-col-serial" style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="brand-bg" style={TH_INLINE_STYLE}>
                  <EditableTableHeader path="commCol.termValue" label={cols.termValue} column="desc" />
                  <EditableTableHeader path="commCol.termKey" label={cols.termKey} column="item" />
                  <EditableTableHeader path="commCol.serial" label={cols.serial || "م"} column="serial" />
                </tr>
              </thead>
              <tbody>
                {quote.commercialTerms.map((row, idx) => (
                  <tr key={row.id}>
                    <EditableTableCell path={`term.${row.id}.termValue`} text={row.termValue} column="desc" />
                    <EditableTableCell path={`term.${row.id}.termKey`} text={row.termKey} column="item" />
                    <EditableTableCell
                      path={`term.${row.id}.serial`}
                      text={row.serial || String(idx + 1)}
                      column="serial"
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          )}

          {show("visualAttachments") && visualAttachments?.length > 0 && (
            <VisualAttachmentsSection attachments={visualAttachments} />
          )}

          <div className="offer-document-tail" style={{ marginTop: "auto", flexShrink: 0 }}>
            {show("closingNote") && quote.closingNote && (
              <section className="offer-closing offer-print-closing offer-print-block">
                <p className="offer-align-ar">
                  <EditableText path="field.closingNote" text={quote.closingNote} block dirHint="rtl" />
                </p>
              </section>
            )}

            {show("signatures") && (
              <section className="offer-print-signatures offer-signature-row offer-signature-row--fixed">
                {sigBlocks.map((sig) => (
                  <div key={sig.id} className="offer-signature-card offer-signature-cell">
                    <p className="offer-signature-title offer-align-ar">{sig.title}</p>
                    <div
                      className="offer-signature-line"
                      aria-hidden
                      style={{ backgroundColor: "#111827", height: "1px" }}
                    />
                    <p className="offer-signature-name offer-align-ar">{sig.name || "—"}</p>
                  </div>
                ))}
              </section>
            )}

            {show("companyFooter") && (
              <OfferDocumentFooter footer={quote.companyFooter} compact={isCompact} />
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
