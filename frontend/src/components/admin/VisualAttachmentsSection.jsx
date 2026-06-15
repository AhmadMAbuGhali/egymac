import { MixedBidiText } from "../../utils/offerBidi.jsx";

/**
 * Visual Offer Extension — print-area section "المرفقات الفنية المصورة".
 * Rendered only when attachments exist (visual mode); standard mode renders nothing.
 */
export default function VisualAttachmentsSection({ attachments }) {
  if (!attachments?.length) return null;

  return (
    <section className="offer-section offer-print-block offer-visual-attachments">
      <h2 className="offer-section-title">
        <span className="offer-section-title-en offer-align-en">Visual Technical Attachments</span>
        <span className="offer-section-title-ar offer-align-ar">
          <span dir="rtl">المرفقات الفنية المصورة</span>
        </span>
      </h2>
      <div className="offer-visual-grid">
        {attachments.map((att) => (
          <figure key={att.id} className="offer-visual-item">
            <img
              src={att.src}
              alt={att.caption || "Technical attachment"}
              className="offer-visual-img"
              decoding="sync"
            />
            {att.caption && (
              <figcaption className="offer-visual-caption offer-align-ar">
                <MixedBidiText text={att.caption} />
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
