import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Gauge,
  Layers,
  Wrench,
  ShieldCheck,
  Cog,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { MOLD_TYPE_MAP, LINE_FOCUS_MAP, OPERATIONAL_BADGES } from "../constants/catalog.js";
import {
  productDisplayName,
  productDisplayDescription,
  productPrimaryImage,
} from "../constants/catalogSchema.js";

function buildSpecRows(item) {
  const isLine = item.catalogType === "line";
  const focus = LINE_FOCUS_MAP[item.productFocus]?.ar || item.productFocus;
  const moldType = MOLD_TYPE_MAP[item.moldType]?.ar || item.moldType;

  return [
    isLine
      ? { label: "نوع الخط / Line Focus", value: focus }
      : { label: "فئة القالب / Mold Category", value: moldType },
    { label: "الطاقة الإنتاجية / Capacity", value: item.capacity },
    { label: "درجة الفولاذ / Steel Grade", value: item.steelGrade },
    { label: "المعالجة الحرارية / Heat Treatment", value: item.heatTreatmentDepth },
    { label: "الوزن / Weight", value: item.weight },
    item.compatibility?.length
      ? { label: "توافق الماكينات / Compatibility", value: item.compatibility.join(" · ") }
      : null,
  ].filter((r) => r && r.value);
}

function SpecTable({ rows, lang }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-ink-muted py-6 text-center">
        {lang === "en" ? "No technical data recorded." : "لا توجد بيانات فنية مسجلة."}
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-border/70 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
      <table className="w-full text-sm border-collapse">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`${i % 2 ? "bg-gray-50/60" : ""} ${i > 0 ? "border-t border-border-light" : ""}`}>
              <td className="px-4 py-3 font-bold text-ink w-2/5 border-e border-border-light" dir="auto">
                {row.label}
              </td>
              <td className="px-4 py-3 text-ink-body" dir="auto">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Elite inline Product Detail Page (صفحة المنتج المستقلة) — a pure visual &
 * technical reference directory, fully detached from the quotation builder.
 */
export default function ProductDetailView({ item, onBack, onQuote }) {
  const { lang } = useLanguage();
  const [tab, setTab] = useState("specs");

  const isUnifiedProduct = item.catalogType === "product";
  const title = isUnifiedProduct
    ? productDisplayName(item, lang)
    : lang === "ar"
      ? item.titleAr || item.title
      : item.title || item.titleAr;
  const desc = isUnifiedProduct
    ? productDisplayDescription(item, lang)
    : lang === "ar"
      ? item.descriptionAr || item.specsAr || item.description || item.specs
      : item.description || item.specs || item.descriptionAr || item.specsAr;

  const primaryImage = isUnifiedProduct ? productPrimaryImage(item) : item.imageUrl;
  const galleryImages = isUnifiedProduct ? item.images || [] : item.imageUrl ? [item.imageUrl] : [];

  const specRows = buildSpecRows(item);
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  const tabs = [
    { id: "specs", labelEn: "Technical Specifications", labelAr: "المواصفات الفنية", icon: Cog },
    { id: "services", labelEn: "Services & Warranty", labelAr: "الخدمات والضمان", icon: ShieldCheck },
    { id: "overview", labelEn: "Overview", labelAr: "نظرة عامة", icon: Layers },
  ];

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-hover hover:bg-accent-light px-3.5 py-2 rounded-xl mb-6 active:scale-95 transition-all duration-200"
      >
        <BackIcon size={16} />
        {lang === "en" ? "Back to Catalog" : "رجوع للكاتالوج"}
      </button>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Large image showcase — asymmetric major column */}
        <div className="lg:col-span-3">
          <div className="bg-surface-section border border-border/70 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group">
            {primaryImage ? (
              <div className="overflow-hidden">
                <img
                  src={primaryImage}
                  alt={title}
                  className="w-full max-h-[480px] object-cover transition-all duration-[400ms] ease-out group-hover:scale-105 group-hover:brightness-[1.02]"
                />
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-accent/30">
                <Cog size={64} />
              </div>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {galleryImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-full h-16 object-cover rounded-lg border border-border/70"
                />
              ))}
            </div>
          )}
          {item.capacity && (
            <div className="mt-4 flex items-center gap-2 text-sm text-ink-body">
              <Gauge size={16} className="text-accent" />
              <span className="font-semibold">{item.capacity}</span>
            </div>
          )}
        </div>

        {/* Detail column */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">
              {isUnifiedProduct
                ? lang === "en"
                  ? "Catalog Product"
                  : "منتج من الفهرس"
                : item.catalogType === "line"
                  ? lang === "en"
                    ? "Fully Automated Production Line"
                    : "خط إنتاج آلي بالكامل"
                  : lang === "en"
                    ? "Custom Mold & Heavy Part"
                    : "قالب مخصص / جزء ثقيل"}
            </p>
            <h1 className="text-2xl font-bold text-ink leading-snug" dir="auto">
              {title}
            </h1>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 -mb-px rounded-t-lg transition-all duration-200 ${
                  tab === t.id
                    ? "border-accent text-accent bg-accent-light/40"
                    : "border-transparent text-ink-muted hover:text-accent hover:bg-accent-light/20"
                }`}
              >
                <t.icon size={13} />
                {lang === "en" ? t.labelEn : t.labelAr}
              </button>
            ))}
          </div>

          <div className="min-h-[180px]">
            {tab === "specs" && <SpecTable rows={specRows} lang={lang} />}

            {tab === "services" && (
              <div className="space-y-3 text-sm">
                {item.customFromScratch && (
                  <p className="flex items-center gap-2 text-ink-body">
                    <Wrench size={15} className="text-accent shrink-0" />
                    {OPERATIONAL_BADGES.customFromScratch[lang]}
                  </p>
                )}
                {item.repairAvailable && (
                  <p className="flex items-center gap-2 text-ink-body">
                    <ShieldCheck size={15} className="text-accent shrink-0" />
                    {OPERATIONAL_BADGES.repairAvailable[lang]}
                  </p>
                )}
                {!item.customFromScratch && !item.repairAvailable && (
                  <p className="text-ink-muted">
                    {lang === "en"
                      ? "Contact our engineering team for service options."
                      : "تواصل مع فريقنا الهندسي لخيارات الخدمة."}
                  </p>
                )}
              </div>
            )}

            {tab === "overview" && (
              <p className="text-sm text-ink-body leading-relaxed" dir="auto">
                {desc || (lang === "en" ? "No overview available." : "لا يوجد وصف متاح.")}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => onQuote(item)}
              className="btn-primary w-full text-sm py-3"
            >
              <FileText size={16} />
              {lang === "en" ? "Request Engineering Quote (RFQ)" : "طلب عرض هندسي"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
