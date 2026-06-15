import "../../styles/catalogAdmin.css";

/**
 * Side-by-side bilingual fields on desktop; tabbed on mobile.
 * Arabic cluster on the right (RTL), English on the left (LTR).
 */
export default function BilingualFieldWorkspace({
  langTab,
  onLangTabChange,
  arContent,
  enContent,
  className = "",
}) {
  return (
    <div className={`catalog-bilingual-workspace ${className}`}>
      <div className="catalog-lang-tabs lg:hidden">
        <button
          type="button"
          onClick={() => onLangTabChange("ar")}
          className={`catalog-lang-tab ${langTab === "ar" ? "catalog-lang-tab--active" : ""}`}
        >
          البيانات بالعربية
        </button>
        <button
          type="button"
          onClick={() => onLangTabChange("en")}
          className={`catalog-lang-tab ${langTab === "en" ? "catalog-lang-tab--active" : ""}`}
        >
          English Details
        </button>
      </div>

      <div className="catalog-bilingual-grid">
        <div
          className={`catalog-lang-panel catalog-lang-panel--en ${
            langTab !== "en" ? "catalog-lang-panel--hidden-mobile" : ""
          }`}
        >
          <p className="catalog-lang-panel-label">English — LTR</p>
          {enContent}
        </div>

        <div
          className={`catalog-lang-panel catalog-lang-panel--ar ${
            langTab !== "ar" ? "catalog-lang-panel--hidden-mobile" : ""
          }`}
        >
          <p className="catalog-lang-panel-label">العربية — RTL</p>
          {arContent}
        </div>
      </div>
    </div>
  );
}
