import { FileText, Factory, Gauge, Layers, Wrench } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { MOLD_TYPE_MAP, LINE_FOCUS_MAP, OPERATIONAL_BADGES } from "../constants/catalog.js";

function ServiceBadges({ item, lang }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {item.customFromScratch && (
        <span className="badge-brand">
          {OPERATIONAL_BADGES.customFromScratch[lang]}
        </span>
      )}
      {item.repairAvailable && (
        <span className="badge-brand-outline">
          <Wrench size={10} className="shrink-0" />
          {OPERATIONAL_BADGES.repairAvailable[lang]}
        </span>
      )}
    </div>
  );
}

/** Fully Automated Production Line card */
export function ProductionLineCard({ item, onQuote, onSelect }) {
  const { lang } = useLanguage();
  const title = lang === "ar" ? item.titleAr : item.title;
  const desc = lang === "ar" ? item.descriptionAr : item.description;
  const focus = LINE_FOCUS_MAP[item.productFocus]?.[lang] || item.productFocus;

  return (
    <article
      onClick={() => onSelect?.({ ...item, catalogType: "line" })}
      className={`card overflow-hidden flex flex-col group transition-all duration-300 ease-out transform hover:-translate-y-1 hover:shadow-lg hover:border-accent bg-surface ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="relative h-44 bg-surface-section overflow-hidden">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-all duration-[400ms] ease-out group-hover:scale-105 group-hover:brightness-[1.02]"
          />
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-accent text-secondary">
          {lang === "en" ? "Fully Automated" : "آلي بالكامل"}
        </span>
        {focus && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-bold bg-surface border border-border text-ink-body">
            {focus}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-ink group-hover:text-accent transition-colors leading-snug">{title}</h3>
        <p className="mt-2 text-sm text-ink-body line-clamp-2 flex-1">{desc}</p>

        <ServiceBadges item={item} lang={lang} />

        <div className="mt-4 flex items-center gap-2 text-xs text-ink-body">
          <Gauge size={14} className="text-accent" />
          <span className="font-semibold">{item.capacity}</span>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          <TechRow label={lang === "en" ? "Steel Grade" : "درجة الفولاذ"} value={item.steelGrade} />
          <TechRow label={lang === "en" ? "Heat Treatment" : "المعالجة الحرارية"} value={item.heatTreatmentDepth} />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuote({ ...item, catalogType: "line" });
          }}
          className="mt-4 btn-primary w-full text-sm py-2.5"
        >
          <FileText size={16} />
          {lang === "en" ? "Request Engineering Quote" : "طلب عرض هندسي"}
        </button>
      </div>
    </article>
  );
}

/** Custom Mold & Heavy Part card */
export function MoldCard({ item, onQuote, onSelect }) {
  const { lang } = useLanguage();
  const title = lang === "ar" ? item.titleAr : item.title;
  const specs = lang === "ar" ? item.specsAr : item.specs;
  const moldType = MOLD_TYPE_MAP[item.moldType]?.[lang] || item.moldType;

  return (
    <article
      onClick={() => onSelect?.({ ...item, catalogType: "mold" })}
      className={`card overflow-hidden flex flex-col group transition-all duration-300 ease-out transform hover:-translate-y-1 hover:shadow-lg hover:border-accent bg-surface ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="relative h-44 bg-surface-section overflow-hidden">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-all duration-[400ms] ease-out group-hover:scale-105 group-hover:brightness-[1.02]"
          />
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-accent text-secondary">
          {moldType}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-ink group-hover:text-accent transition-colors leading-snug">{title}</h3>
        <p className="mt-2 text-sm text-ink-body line-clamp-2 flex-1">{specs}</p>

        <ServiceBadges item={item} lang={lang} />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.compatibility?.map((b) => (
            <span key={b} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-section border border-border text-ink-muted">
              {b}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          <TechRow label={lang === "en" ? "Steel Grade" : "درجة الفولاذ"} value={item.steelGrade} highlight />
          <TechRow label={lang === "en" ? "Heat Treatment Depth" : "عمق المعالجة الحرارية"} value={item.heatTreatmentDepth} highlight />
          {item.weight && (
            <p className="text-xs text-ink-muted flex items-center gap-1">
              <Layers size={12} className="text-accent" /> {item.weight}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuote({ ...item, catalogType: "mold" });
          }}
          className="mt-4 btn-primary w-full text-sm py-2.5"
        >
          <FileText size={16} />
          {lang === "en" ? "Request Engineering Quote" : "طلب عرض هندسي"}
        </button>
      </div>
    </article>
  );
}

function TechRow({ label, value, highlight }) {
  return (
    <div className="text-xs">
      <span className="text-ink-muted">{label}: </span>
      <span className={highlight ? "font-semibold text-ink" : "text-ink-body"}>{value || "—"}</span>
    </div>
  );
}

export function CatalogEmpty({ lang }) {
  return (
    <div className="text-center py-16 text-ink-muted flex flex-col items-center gap-2">
      <Factory size={32} className="text-accent/40" />
      <p>{lang === "en" ? "No items match your filters." : "لا توجد عناصر مطابقة."}</p>
    </div>
  );
}
