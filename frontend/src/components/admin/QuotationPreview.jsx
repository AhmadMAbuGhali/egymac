import { useLanguage } from "../../context/LanguageContext.jsx";
import { SERVICE_CATEGORY_MAP } from "../../constants/catalog.js";

export default function QuotationPreview({ quotation, grandTotal }) {
  const { lang } = useLanguage();
  const q = quotation;

  return (
    <div id="quotation-print-root" className="quotation-document bg-white text-ink border border-border rounded-lg shadow-card overflow-hidden">
      <div className="h-1 bg-accent" />
      <div className="p-8">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-6 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Egy Mac" className="h-14 w-auto" />
            <div>
              <h2 className="text-lg font-bold text-ink">EGY MAC MACHINE</h2>
              <p className="text-xs text-ink-body">Fully Automated Lines · Custom Fabrication · Repair & Re-manufacture</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-accent font-bold text-sm uppercase">{lang === "en" ? "Price Offer" : "عرض سعر"}</p>
            <p className="text-xs text-ink-muted mt-1">Ref: {q.referenceNumber}</p>
            <p className="text-xs text-ink-muted">Date: {q.date}</p>
          </div>
        </div>

        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase text-ink mb-3">{lang === "en" ? "Client Information" : "بيانات العميل"}</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div><span className="text-ink-muted text-xs block">{lang === "en" ? "Company" : "الشركة"}</span><span className="font-medium">{q.client.companyName || "—"}</span></div>
            <div><span className="text-ink-muted text-xs block">{lang === "en" ? "Location" : "الموقع"}</span><span className="font-medium">{q.client.projectLocation || "—"}</span></div>
            <div><span className="text-ink-muted text-xs block">{lang === "en" ? "Attention" : "عناية"}</span><span className="font-medium">{q.client.attentionTo || "—"}</span></div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase text-ink mb-3">{lang === "en" ? "Engineering & Fabrication Items" : "بنود الهندسة والتصنيع"}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-surface-section text-left text-xs uppercase text-ink-muted">
                  <th className="border border-border px-2 py-2">#</th>
                  <th className="border border-border px-2 py-2">{lang === "en" ? "Service" : "الخدمة"}</th>
                  <th className="border border-border px-2 py-2">{lang === "en" ? "Item" : "البند"}</th>
                  <th className="border border-border px-2 py-2">{lang === "en" ? "Scope" : "النطاق"}</th>
                  <th className="border border-border px-2 py-2">{lang === "en" ? "Specs" : "المواصفات"}</th>
                  <th className="border border-border px-2 py-2 text-center">{lang === "en" ? "Hrs" : "ساعات"}</th>
                  <th className="border border-border px-2 py-2 text-center">Qty</th>
                  <th className="border border-border px-2 py-2 text-right">{lang === "en" ? "Total" : "الإجمالي"}</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-border px-2 py-2 text-ink-muted">{idx + 1}</td>
                    <td className="border border-border px-2 py-2 text-xs">{SERVICE_CATEGORY_MAP[item.serviceCategory]?.[lang] || item.serviceCategory || "—"}</td>
                    <td className="border border-border px-2 py-2 font-medium text-xs">{item.equipmentMoldType || item.description || "—"}</td>
                    <td className="border border-border px-2 py-2 text-xs text-ink-body">{item.scopeOfWork || "—"}</td>
                    <td className="border border-border px-2 py-2 text-xs text-ink-body">{item.technicalSpecs || item.materialSpec || "—"}</td>
                    <td className="border border-border px-2 py-2 text-center text-xs">{item.laborHours || "—"}</td>
                    <td className="border border-border px-2 py-2 text-center">{item.quantity}</td>
                    <td className="border border-border px-2 py-2 text-right font-semibold">{fmt(item.totalPrice, q.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="border border-border px-2 py-3 text-right font-bold">{lang === "en" ? "Grand Total" : "الإجمالي"}</td>
                  <td className="border border-border px-2 py-3 text-right font-bold text-accent">{fmt(grandTotal, q.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase text-ink mb-3">{lang === "en" ? "Commercial Terms" : "الشروط التجارية"}</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-ink-body">
            <p><strong className="text-ink">{lang === "en" ? "Delivery:" : "التسليم:"}</strong> {q.commercial.deliveryTimeline || q.commercial.deliveryTime}</p>
            <p><strong className="text-ink">{lang === "en" ? "Payment:" : "الدفع:"}</strong> {q.commercial.paymentTerms}</p>
            <p><strong className="text-ink">{lang === "en" ? "Warranty:" : "الضمان:"}</strong> {q.commercial.warrantyCertification || q.commercial.warrantyPeriod}</p>
            <p><strong className="text-ink">{lang === "en" ? "Validity:" : "الصلاحية:"}</strong> {q.commercial.validity}</p>
          </div>
        </section>

        <div className="border-t-2 border-accent pt-6 grid sm:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase mb-8">{lang === "en" ? "Egy Mac — Authorized" : "إيجي ماك — معتمد"}</p>
            <div className="border-b border-ink w-48 mb-2" />
            <p className="text-xs text-ink-body">Sales & Engineering</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase mb-8">{lang === "en" ? "Client Acceptance" : "موافقة العميل"}</p>
            <div className="border-b border-ink w-48 mb-2" />
            <p className="text-xs text-ink-body">Name / Title / Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(amount, currency = "EGP") {
  return `${(Number(amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`;
}
