import { BRAND_PRIMARY, FOOTER_ACCENT_STYLE } from "../constants/offerPrintStyles.js";
import { EditableText } from "./admin/inlineEdit.jsx";

/**
 * Official footer — anchored at base of #quotation-print-area with #3b767c accent rule.
 * Footer lines are inline-editable when a QuoteEditProvider is present;
 * without one they render exactly as before (read-only MixedBidiText).
 */
export default function OfferDocumentFooter({ footer, compact = false }) {
  const f = footer || {};

  return (
    <footer
      className={`offer-document-footer offer-footer-anchored ${compact ? "offer-document-footer--compact" : ""}`}
      style={FOOTER_ACCENT_STYLE}
    >
      <div
        className="offer-footer-rule"
        aria-hidden
        style={{ backgroundColor: BRAND_PRIMARY, height: "1px", width: "100%" }}
      />

      {f.companyName && (
        <p className="offer-footer-brand offer-align-center">
          <EditableText path="footer.companyName" text={f.companyName} />
        </p>
      )}

      <div className="offer-footer-grid">
        <div className="offer-footer-col offer-footer-col--en">
          {f.headquartersEn && (
            <p className="offer-footer-line offer-align-en">
              <EditableText path="footer.headquartersEn" text={f.headquartersEn} dirHint="ltr" />
            </p>
          )}
          {f.factoryEn && (
            <p className="offer-footer-line offer-align-en">
              <EditableText path="footer.factoryEn" text={f.factoryEn} dirHint="ltr" />
            </p>
          )}
        </div>
        <div className="offer-footer-col offer-footer-col--ar">
          {f.headquartersAr && (
            <p className="offer-footer-line offer-align-ar">
              <span dir="rtl">
                <EditableText path="footer.headquartersAr" text={f.headquartersAr} dirHint="rtl" />
              </span>
            </p>
          )}
          {f.factoryAr && (
            <p className="offer-footer-line offer-align-ar">
              <span dir="rtl">
                <EditableText path="footer.factoryAr" text={f.factoryAr} dirHint="rtl" />
              </span>
            </p>
          )}
        </div>
      </div>

      {(f.website || f.phone) && (
        <p className="offer-footer-contact offer-align-center">
          {f.website && (
            <span dir="ltr" className="inline-block offer-ltr-isolate">
              <EditableText path="footer.website" text={f.website} dirHint="ltr" />
            </span>
          )}
          {f.website && f.phone && <span className="offer-footer-dot">·</span>}
          {f.phone && (
            <span
              dir="ltr"
              className="inline-block offer-ltr-isolate offer-footer-phone"
              style={{ color: BRAND_PRIMARY, fontWeight: 700 }}
            >
              <EditableText path="footer.phone" text={f.phone} dirHint="ltr" />
            </span>
          )}
        </p>
      )}

      {(f.extraLines || []).map(
        (line, i) =>
          line && (
            <p key={i} className="offer-footer-extra offer-align-center">
              <EditableText path={`footerLine.${i}`} text={line} />
            </p>
          )
      )}
    </footer>
  );
}
