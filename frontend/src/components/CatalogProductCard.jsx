import { FileText, MessageSquare, Layers, Weight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  productDisplayName,
  productDisplayDescription,
  productPrimaryImage,
} from "../constants/catalogSchema.js";
import { extractProductSpecs } from "../utils/catalogStorefrontUtils.js";
import "../styles/catalogStorefront.css";

export default function CatalogProductCard({ product, categoryPath, onQuote, onSelect }) {
  const { lang } = useLanguage();
  const title = productDisplayName(product, lang);
  const desc = productDisplayDescription(product, lang);
  const image = productPrimaryImage(product);
  const specs = extractProductSpecs(product, lang);

  const L = {
    en: {
      datasheet: "Technical Datasheet",
      inquire: "Request Quote",
    },
    ar: {
      datasheet: "البيانات الفنية",
      inquire: "طلب عرض سعر",
    },
  }[lang];

  return (
    <article className="catalog-product-card group">
      <button
        type="button"
        onClick={() => onSelect?.({ ...product, catalogType: "product" })}
        className="catalog-product-card__hitarea"
        aria-label={title}
      >
        <div className="catalog-product-card__media">
          {image ? (
            <img src={image} alt={title} loading="lazy" className="catalog-product-card__img" />
          ) : (
            <div className="catalog-product-card__placeholder">
              <Layers size={40} strokeWidth={1.25} />
              <span>EGY MAC</span>
            </div>
          )}
          {categoryPath ? (
            <span className="catalog-product-card__category">{categoryPath.split(" › ").pop()}</span>
          ) : null}
        </div>

        <div className="catalog-product-card__body">
          <h3 className="catalog-product-card__title" dir={lang === "ar" ? "rtl" : "ltr"}>
            {title}
          </h3>
          <p className="catalog-product-card__desc line-clamp-2" dir={lang === "ar" ? "rtl" : "ltr"}>
            {desc}
          </p>

          {specs.length > 0 ? (
            <div className="catalog-product-card__spec-badges">
              {specs.map((spec) => (
                <span key={`${spec.label}-${spec.value}`} className="catalog-spec-badge">
                  <span className="catalog-spec-badge__label">{spec.label}</span>
                  <span className="catalog-spec-badge__value">{spec.value}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="catalog-product-card__spec-badges">
              <span className="catalog-spec-badge catalog-spec-badge--muted">
                <Weight size={12} />
                <span className="catalog-spec-badge__value">{L.engineered}</span>
              </span>
            </div>
          )}
        </div>
      </button>

      <div className="catalog-product-card__actions">
        <button
          type="button"
          onClick={() => onSelect?.({ ...product, catalogType: "product" })}
          className="catalog-product-card__btn catalog-product-card__btn--primary"
        >
          <FileText size={17} strokeWidth={2.25} />
          {L.datasheet}
        </button>
        <button
          type="button"
          onClick={() => onQuote?.({ ...product, catalogType: "product" })}
          className="catalog-product-card__btn catalog-product-card__btn--ghost"
        >
          <MessageSquare size={16} />
          {L.inquire}
        </button>
      </div>
    </article>
  );
}
