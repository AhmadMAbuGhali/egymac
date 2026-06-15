import { Eye, EyeOff } from "lucide-react";
import { SECTION_LABELS } from "../../constants/quoteSectionVisibility.js";

/**
 * Dashboard workspace block with visibility toggle (مفتاح إظهار/إخفاء القسم).
 */
export default function WorkspaceSection({
  sectionKey,
  title,
  helper,
  visible = true,
  onToggleVisibility,
  children,
  className = "",
}) {
  const labels = SECTION_LABELS[sectionKey];
  const displayTitle = title || (labels ? `${labels.ar} — ${labels.en}` : sectionKey);

  return (
    <section
      className={`ws-section no-print ${!visible ? "border-dashed border-slate-200" : ""} ${className}`}
      data-section={sectionKey}
      data-visible={visible}
    >
      <div className="ws-section-header">
        <div className="min-w-0 flex-1">
          <h3 className="ws-section-title">{displayTitle}</h3>
          {helper && <p className="ws-section-helper">{helper}</p>}
          {!visible && (
            <span className="ws-section--hidden-badge mt-2 inline-flex">
              <EyeOff size={11} /> مخفي في المعاينة والطباعة
            </span>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label={visible ? `إخفاء ${displayTitle}` : `إظهار ${displayTitle}`}
          onClick={() => onToggleVisibility?.(sectionKey, !visible)}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            visible ? "bg-accent" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
              visible ? "start-5" : "start-0.5"
            }`}
          />
        </button>
      </div>

      <div className={`ws-section-body ${!visible ? "ws-section-body--dimmed" : ""}`}>{children}</div>
    </section>
  );
}
