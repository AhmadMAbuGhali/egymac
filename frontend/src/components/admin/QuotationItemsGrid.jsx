import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { SERVICE_CATEGORIES } from "../../constants/catalog.js";

export default function QuotationItemsGrid({
  items, currency,
  onUpdateItem, onAddItem, onRemoveItem, onCurrencyChange,
}) {
  const { lang } = useLanguage();

  const L = {
    en: {
      title: "Engineering & Fabrication Line Items",
      category: "Service Type",
      type: "Equipment / Mold / Component",
      scope: "Scope of Work / Line Config",
      specs: "Technical Specs",
      compat: "Machine Compatibility",
      hours: "Labor Hrs",
      qty: "Qty", unit: "Unit Price", total: "Total", add: "Add Row",
      phType: "e.g. Fully Automated Block Line / Zenith Interlock Mold",
      phScope: "Turnkey layout, repair scope, re-manufacture details…",
      phSpecs: "Carburized steel, HRC 58–62, fabrication method",
      phCompat: "Zenith, Hess, Masa",
    },
    ar: {
      title: "بنود الهندسة والتصنيع",
      category: "نوع الخدمة",
      type: "المعدة / القالب / المكون",
      scope: "نطاق العمل / تكوين الخط",
      specs: "المواصفات الفنية",
      compat: "توافق الماكينة",
      hours: "ساعات",
      qty: "الكمية", unit: "سعر الوحدة", total: "الإجمالي", add: "إضافة صف",
      phType: "مثال: خط بلوك آلي / قالب Zenith",
      phScope: "تخطيط متكامل، نطاق إصلاح، تفاصيل إعادة تصنيع…",
      phSpecs: "فولاذ معالج، HRC 58–62",
      phCompat: "Zenith, Hess, Masa",
    },
  }[lang];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wide">{L.title}</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted font-medium">Currency</label>
          <select value={currency} onChange={(e) => onCurrencyChange(e.target.value)} className="input-field py-1.5 w-24 text-xs">
            <option value="EGP">EGP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto custom-scroll rounded-lg border border-border">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="bg-surface-section text-left text-xs uppercase text-ink-muted">
              <th className="px-2 py-2.5 w-8">#</th>
              <th className="px-2 py-2.5 w-36">{L.category}</th>
              <th className="px-2 py-2.5 min-w-[150px]">{L.type}</th>
              <th className="px-2 py-2.5 min-w-[140px]">{L.scope}</th>
              <th className="px-2 py-2.5 min-w-[120px]">{L.specs}</th>
              <th className="px-2 py-2.5 w-28">{L.compat}</th>
              <th className="px-2 py-2.5 w-16">{L.hours}</th>
              <th className="px-2 py-2.5 w-14">{L.qty}</th>
              <th className="px-2 py-2.5 w-24">{L.unit}</th>
              <th className="px-2 py-2.5 w-24">{L.total}</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-t border-border hover:bg-surface-muted/40">
                <td className="px-2 py-1.5 text-ink-muted text-xs">{idx + 1}</td>
                <td className="px-1.5 py-1.5">
                  <select
                    value={item.serviceCategory || "custom-mold-part"}
                    onChange={(e) => onUpdateItem(item.id, "serviceCategory", e.target.value)}
                    className="input-field py-1.5 text-xs"
                  >
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c[lang]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-1.5 py-1.5">
                  <input value={item.equipmentMoldType} onChange={(e) => onUpdateItem(item.id, "equipmentMoldType", e.target.value)} placeholder={L.phType} className="input-field py-1.5 text-xs" />
                </td>
                <td className="px-1.5 py-1.5">
                  <input value={item.scopeOfWork} onChange={(e) => onUpdateItem(item.id, "scopeOfWork", e.target.value)} placeholder={L.phScope} className="input-field py-1.5 text-xs" />
                </td>
                <td className="px-1.5 py-1.5">
                  <input value={item.technicalSpecs} onChange={(e) => onUpdateItem(item.id, "technicalSpecs", e.target.value)} placeholder={L.phSpecs} className="input-field py-1.5 text-xs" />
                </td>
                <td className="px-1.5 py-1.5">
                  <input value={item.machineCompatibility} onChange={(e) => onUpdateItem(item.id, "machineCompatibility", e.target.value)} placeholder={L.phCompat} className="input-field py-1.5 text-xs" />
                </td>
                <td className="px-1.5 py-1.5">
                  <input type="number" min="0" step="0.5" value={item.laborHours} onChange={(e) => onUpdateItem(item.id, "laborHours", e.target.value)} className="input-field py-1.5 text-xs text-center" placeholder="0" />
                </td>
                <td className="px-1.5 py-1.5">
                  <input type="number" min="0" value={item.quantity} onChange={(e) => onUpdateItem(item.id, "quantity", e.target.value)} className="input-field py-1.5 text-xs text-center" />
                </td>
                <td className="px-1.5 py-1.5">
                  <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => onUpdateItem(item.id, "unitPrice", e.target.value)} className="input-field py-1.5 text-xs text-right" />
                </td>
                <td className="px-2 py-1.5 text-right font-semibold text-ink text-xs whitespace-nowrap">
                  {(Number(item.totalPrice) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="px-1.5 py-1.5">
                  <button type="button" onClick={() => onRemoveItem(item.id)} disabled={items.length <= 1} className="p-1.5 text-ink-muted hover:text-red-600 disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={onAddItem} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover">
        <Plus size={16} /> {L.add}
      </button>
    </div>
  );
}
