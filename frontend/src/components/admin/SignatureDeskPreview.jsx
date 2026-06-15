import { useEffect, useState } from "react";
import { ChevronDown, PenLine } from "lucide-react";
import {
  FIXED_SIGNATURE_TITLES,
  SIGNATURE_EXECUTION_NAME,
  SIGNATURE_GM_NAME,
} from "../../constants/signatures.js";

/**
 * High-fidelity live mockup of the 3-tier print signature row.
 */
export default function SignatureDeskPreview({
  salespersonId,
  salespersonRoster = [],
  onSalespersonChange,
}) {
  const selected = salespersonRoster.find((sp) => String(sp.id) === String(salespersonId));
  const salesName = selected?.name || "";
  const [displayName, setDisplayName] = useState(salesName);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setFadeKey((k) => k + 1);
    setDisplayName(salesName);
  }, [salesName]);

  return (
    <div className="signature-desk-widget">
      <div>
        <label
          htmlFor="signature-desk-select"
          className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 leading-relaxed"
        >
          مسؤول البيع — Sales Manager
        </label>
        <div className="signature-desk-select-wrap relative">
          <select
            id="signature-desk-select"
            value={salespersonId ?? ""}
            onChange={(e) => onSalespersonChange?.(e.target.value)}
            className="cursor-pointer"
            dir="rtl"
          >
            <option value="">— اختر مسؤول البيع —</option>
            {salespersonRoster.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden
          />
        </div>
        <p className="text-[11px] text-slate-400 font-normal leading-relaxed mt-2">
          يظهر الاسم المختار في العمود الأول من صف التوقيعات بالمستند المطبوع.
        </p>
      </div>

      <div className="signature-desk-preview">
        <p className="signature-desk-preview__title">
          <PenLine size={12} className="inline-block me-1.5 -mt-0.5" aria-hidden />
          معاينة التوقيعات — كما ستظهر في PDF
        </p>

        <div className="signature-desk-grid" dir="rtl">
          {/* Column 1 — Sales (dynamic) */}
          <div className="signature-desk-slot signature-desk-slot--active">
            <p className="signature-desk-slot__label">{FIXED_SIGNATURE_TITLES.sales}</p>
            <div className="signature-desk-slot__line" />
            <p
              key={`sales-${fadeKey}`}
              className={`signature-desk-slot__name signature-name-fade ${
                displayName ? "" : "signature-desk-slot__name--placeholder"
              }`}
              dir="rtl"
            >
              {displayName || "اختر مسؤول البيع…"}
            </p>
          </div>

          {/* Column 2 — Execution */}
          <div className="signature-desk-slot">
            <p className="signature-desk-slot__label">{FIXED_SIGNATURE_TITLES.execution}</p>
            <div className="signature-desk-slot__line" />
            <p className="signature-desk-slot__name" dir="rtl">
              {SIGNATURE_EXECUTION_NAME}
            </p>
          </div>

          {/* Column 3 — GM */}
          <div className="signature-desk-slot">
            <p className="signature-desk-slot__label">{FIXED_SIGNATURE_TITLES.gm}</p>
            <div className="signature-desk-slot__line" />
            <p className="signature-desk-slot__name" dir="rtl">
              {SIGNATURE_GM_NAME}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
