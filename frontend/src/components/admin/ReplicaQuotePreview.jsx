import { MixedBidiText } from "../../utils/offerBidi.jsx";
import { EditableText } from "./inlineEdit.jsx";
import { resolveFixedSignatures } from "../../constants/signatures.js";
import { isSectionVisible } from "../../constants/quoteSectionVisibility.js";
import "../../styles/replicaQuote.print.css";

/**
 * Replica template — carbon copy of the reference offer layout
 * (per-page header/footer, watermark, photo-beside-spec-table blocks)
 * with the palette locked to #3b767c and typography locked to Cairo.
 * Fully additive: the standard FreeFormQuotePreview is untouched.
 */

function FooterIcon({ type }) {
  const common = { className: "rp-footer-icon", viewBox: "0 0 24 24", fill: "#3b767c" };
  if (type === "phone") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="11" />
        <path
          d="M16.6 14.4c-.5-.2-1.2-.6-1.6-.7-.3-.1-.6 0-.8.3l-.5.7c-.2.2-.4.2-.7.1-1-.5-2.1-1.5-2.7-2.5-.1-.3-.1-.5.1-.7l.6-.6c.2-.2.3-.5.2-.8-.1-.4-.5-1.2-.7-1.6-.2-.4-.5-.5-.9-.4l-1 .3c-.4.2-.7.6-.7 1 .1 1.6.9 3.5 2.4 5s3.4 2.3 5 2.4c.4 0 .8-.3 1-.7l.3-1c.1-.3 0-.7-.4-.8z"
          fill="#ffffff"
        />
      </svg>
    );
  }
  if (type === "pin") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="11" />
        <path
          d="M12 5.5c-2.5 0-4.5 2-4.5 4.5 0 3.4 4.5 8.5 4.5 8.5s4.5-5.1 4.5-8.5c0-2.5-2-4.5-4.5-4.5zm0 6.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4z"
          fill="#ffffff"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="11" />
      <path
        d="M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5.4 6.3h-2.5a11 11 0 0 0-.9-3.9 5.6 5.6 0 0 1 3.4 3.9zM12 6.5c.6.8 1.3 2.2 1.5 4.1h-3c.2-1.9.9-3.3 1.5-4.1zm-2 .9a11 11 0 0 0-.9 3.9H6.6A5.6 5.6 0 0 1 10 7.4zm-3.4 5.3h2.5c.1 1.5.4 2.8.9 3.9a5.6 5.6 0 0 1-3.4-3.9zm5.4 4.8c-.6-.8-1.3-2.2-1.5-4.1h3c-.2 1.9-.9 3.3-1.5 4.1zm2-.9c.5-1.1.8-2.4.9-3.9h2.5a5.6 5.6 0 0 1-3.4 3.9z"
        fill="#ffffff"
      />
    </svg>
  );
}

function PageHeader() {
  return (
    <header className="rp-page-header">
      <img src="/logo.png" alt="Egy Mac Machine" className="rp-header-logo" decoding="async" />
      <h1 className="rp-header-company">EGY MAC Machine</h1>
      <p className="rp-header-tagline">Concrete Block Molds &amp; Industrial Machinery</p>
      <div className="rp-header-rule" aria-hidden />
    </header>
  );
}

function PageFooter({ footer }) {
  const f = footer || {};
  return (
    <footer className="rp-page-footer">
      <div className="rp-footer-rows">
        {f.phone && (
          <div className="rp-footer-row">
            <FooterIcon type="phone" />
            <span dir="ltr">
              <EditableText path="footer.phone" text={f.phone} dirHint="ltr" />
            </span>
          </div>
        )}
        {(f.headquartersEn || f.factoryEn) && (
          <div className="rp-footer-row">
            <FooterIcon type="pin" />
            <span>
              {f.headquartersEn && (
                <EditableText path="footer.headquartersEn" text={f.headquartersEn} dirHint="ltr" />
              )}
              {f.headquartersEn && f.factoryEn && <br />}
              {f.factoryEn && <EditableText path="footer.factoryEn" text={f.factoryEn} dirHint="ltr" />}
            </span>
          </div>
        )}
        {f.website && (
          <div className="rp-footer-row">
            <FooterIcon type="globe" />
            <span dir="ltr">
              <EditableText path="footer.website" text={f.website} dirHint="ltr" />
            </span>
          </div>
        )}
        {(f.extraLines || []).filter(Boolean).map((line, i) => (
          <div key={i} className="rp-footer-row">
            <span dir="rtl">{line}</span>
          </div>
        ))}
      </div>
      <div className="rp-footer-band" aria-hidden />
    </footer>
  );
}

function SectionTitle({ title, fallback }) {
  const raw = title || fallback;
  if (raw.includes("/")) {
    const [ar, ...rest] = raw.split("/");
    return (
      <h2 className="rp-section-title">
        <span className="rp-title-accent" dir="rtl">
          {ar.trim()}
        </span>{" "}
        <span dir="ltr">{rest.join("/").trim()}</span>
      </h2>
    );
  }
  return (
    <h2 className="rp-section-title">
      <MixedBidiText text={raw} />
    </h2>
  );
}

export default function ReplicaQuotePreview({
  quote,
  printMode = "spanned",
  visualAttachments = null,
  sectionVisibility = null,
}) {
  const techCols = quote.technicalColumns || {};
  const commCols = quote.commercialColumns || {};
  const attachments = visualAttachments || [];
  const mainImage = attachments[0] || null;
  const extraImages = attachments.slice(1);
  const sigBlocks = resolveFixedSignatures(quote);
  const vis = sectionVisibility ?? quote.sectionVisibility;
  const show = (key) => isSectionVisible(vis, key);

  const greetingLines = String(quote.greeting || "").split("\n");
  const greetingFirst = greetingLines[0] || "";
  const greetingRest = greetingLines.slice(1).join("\n").trim();

  return (
    <div className="replica-print-wrapper">
      <article
        id="replica-print-area"
        dir="rtl"
        className={`print-mode-${printMode}`}
        data-print-mode={printMode}
      >
        <div className="rp-watermark" aria-hidden>
          <img src="/logo.png" alt="" decoding="async" />
        </div>

        <table className="rp-doc-table">
          <thead>
            <tr>
              <td>
                <PageHeader />
              </td>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>
                {show("companyFooter") ? <PageFooter footer={quote.companyFooter} /> : null}
              </td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td className="rp-body-cell">
                <div className="rp-body-inner">
                  {show("documentMeta") && quote.documentTitle && (
                    <p className="rp-doc-title">
                      <span dir="rtl">
                        <EditableText path="field.documentTitle" text={quote.documentTitle} dirHint="rtl" />
                      </span>
                    </p>
                  )}

                  {show("documentMeta") && (
                  <div className="rp-meta">
                    <p>
                      <span className="rp-meta-label">التاريخ : </span>
                      <span className="rp-meta-value" dir="ltr">
                        <EditableText path="field.date" text={quote.date} dirHint="ltr" />
                      </span>
                    </p>
                    <p>
                      <span className="rp-meta-label">السادة : </span>
                      <span className="rp-meta-value">
                        <EditableText path="field.clientName" text={quote.clientName} dirHint="rtl" />
                      </span>
                    </p>
                    <p>
                      <span className="rp-meta-label">رقم المرجعي : </span>
                      <span className="rp-meta-value" dir="ltr">
                        <EditableText path="field.referenceNumber" text={quote.referenceNumber} dirHint="ltr" />
                      </span>
                    </p>
                  </div>
                  )}

                  {show("greeting") && greetingFirst && (
                    <p className="rp-greeting-line">
                      <EditableText path="greetingFirst" text={greetingFirst} dirHint="rtl" />
                    </p>
                  )}
                  {show("greeting") && greetingRest && (
                    <div className="rp-greeting-body">
                      <EditableText path="greetingRest" text={greetingRest} block dirHint="rtl" />
                    </div>
                  )}

                  {show("technicalSpecs") && (
                  <>
                  <SectionTitle
                    title={quote.technicalSectionTitle}
                    fallback="المواصفات الفنية / Technical Specifications"
                  />
                  <div className="rp-product-grid">
                    {mainImage && (
                      <div className="rp-product-img-box">
                        <img src={mainImage.src} alt={mainImage.caption || "Product"} />
                      </div>
                    )}
                    <div className="rp-product-table-box">
                      <table className="rp-table" dir="rtl">
                        <thead>
                          <tr>
                            <th style={{ width: "40%" }}>
                              <EditableText path="techCol.parameter" text={techCols.parameter || "التفاصيل الفنية"} />
                            </th>
                            <th style={{ width: "60%" }}>
                              <EditableText path="techCol.value" text={techCols.value || "الوصف"} />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {quote.technicalSpecs.map((row) => {
                            const isPrice = /price|سعر|اجمال|إجمال/i.test(row.parameter || "");
                            return (
                              <tr key={row.id} className={isPrice ? "rp-row-price" : ""}>
                                <td className="rp-cell-label">
                                  <EditableText path={`spec.${row.id}.parameter`} text={row.parameter} />
                                </td>
                                <td>
                                  <EditableText path={`spec.${row.id}.value`} text={row.value} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {show("visualAttachments") && extraImages.length > 0 && (
                    <div className="rp-attachments-grid">
                      {extraImages.map((att) => (
                        <figure key={att.id} className="rp-attachment">
                          <img src={att.src} alt={att.caption || "Attachment"} />
                          {att.caption && (
                            <figcaption>
                              <MixedBidiText text={att.caption} />
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  )}
                  </>
                  )}

                  {show("commercialTerms") && (
                  <>
                  <SectionTitle
                    title={quote.commercialSectionTitle}
                    fallback="العرض المالي وشروط التعاقد / Commercial Terms"
                  />
                  <table className="rp-table rp-commercial-table" dir="rtl">
                    <colgroup>
                      <col className="rp-col-serial" />
                      <col className="rp-col-key" />
                      <col className="rp-col-value" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>
                          <EditableText path="commCol.serial" text={commCols.serial || "م"} />
                        </th>
                        <th>
                          <EditableText path="commCol.termKey" text={commCols.termKey || "البند"} />
                        </th>
                        <th>
                          <EditableText path="commCol.termValue" text={commCols.termValue || "التفاصيل و الشروط"} />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.commercialTerms.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="rp-cell-label">
                            <EditableText path={`term.${row.id}.serial`} text={row.serial || String(idx + 1)} dirHint="ltr" />
                          </td>
                          <td className="rp-cell-label">
                            <EditableText path={`term.${row.id}.termKey`} text={row.termKey} />
                          </td>
                          <td className="rp-cell-value">
                            <EditableText path={`term.${row.id}.termValue`} text={row.termValue} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                  )}

                  {show("closingNote") && quote.closingNote && (
                    <p className="rp-note">
                      <EditableText path="field.closingNote" text={quote.closingNote} dirHint="rtl" />
                    </p>
                  )}

                  {show("signatures") && (
                    <div className="rp-signatures rp-signatures--fixed">
                      {sigBlocks.map((sig) => (
                        <div key={sig.id} className="rp-signature rp-signature-cell">
                          <p className="rp-signature-title">{sig.title}</p>
                          <p className="rp-signature-name">{sig.name || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </article>
    </div>
  );
}
