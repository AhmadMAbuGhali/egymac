import { useState } from "react";
import { X, Send, Loader2, CheckCircle } from "lucide-react";
import { submitInquiry } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { SERVICE_CATEGORIES } from "../constants/catalog.js";
import { productDisplayName } from "../constants/catalogSchema.js";

const LABELS = {
  en: {
    title: "Request Engineering Quote",
    intent: "Service Intent *",
    company: "Company Name *",
    phone: "Contact Phone *",
    email: "Corporate Email *",
    quantity: "Quantity / Scope",
    custom: "Technical Requirements & Scope",
    customPh: "Line configuration, custom mold dimensions, damaged component details, repair hours needed, machine model…",
    submit: "Submit Quote Request",
    sending: "Submitting…",
    success: "Your engineering quote request has been submitted successfully.",
  },
  ar: {
    title: "طلب عرض هندسي",
    intent: "نوع الخدمة *",
    company: "اسم الشركة *",
    phone: "هاتف الاتصال *",
    email: "البريد الإلكتروني *",
    quantity: "الكمية / النطاق",
    custom: "المتطلبات الفنية ونطاق العمل",
    customPh: "تكوين الخط، أبعاد القالب، تفاصيل المكون التالف، ساعات الإصلاح، طراز الماكينة…",
    submit: "إرسال الطلب",
    sending: "جاري الإرسال…",
    success: "تم إرسال طلب العرض الهندسي بنجاح.",
  },
};

export default function RFQModal({ product, onClose }) {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const productName = product
    ? product.catalogType === "product"
      ? productDisplayName(product, lang)
      : lang === "ar"
        ? product.titleAr
        : product.title
    : "";

  const defaultIntent =
    product?.catalogType === "line"
      ? "automated-line"
      : product?.catalogType === "product"
        ? "custom-mold-part"
        : product?.repairAvailable && !product?.customFromScratch
          ? "repair-overhaul"
          : "custom-mold-part";

  const [form, setForm] = useState({
    serviceIntent: defaultIntent,
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    quantity: "",
    customizations: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await submitInquiry({
        productId: product?.id,
        catalogType: product?.catalogType || null,
        serviceIntent: form.serviceIntent,
        productName,
        companyName: form.companyName,
        contactPerson: form.contactPerson || form.companyName,
        phone: form.phone,
        email: form.email,
        quantity: form.quantity,
        customizations: form.customizations,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-overlay backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface border border-border/70 rounded-2xl shadow-soft-lg animate-fade-in">
        <div className="flex items-start justify-between px-6 py-5 border-b border-border/70">
          <div>
            <h3 className="font-bold text-ink text-lg">{t.title}</h3>
            {productName && (
              <p className="text-accent text-sm font-semibold mt-1">{productName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-accent p-1.5 rounded-lg hover:bg-accent-light active:scale-90 transition-all duration-150"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">{t.intent}</label>
            <select name="serviceIntent" required value={form.serviceIntent} onChange={handleChange} className="input-field">
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c[lang]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">{t.company}</label>
            <input name="companyName" required value={form.companyName} onChange={handleChange} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1.5">{t.phone}</label>
              <input name="phone" required value={form.phone} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1.5">{t.email}</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">{t.quantity}</label>
            <input name="quantity" value={form.quantity} onChange={handleChange} className="input-field" placeholder={lang === "en" ? "e.g. 1 turnkey line / 4 molds / 120 repair hrs" : "مثال: خط واحد / 4 قوالب / 120 ساعة إصلاح"} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">{t.custom}</label>
            <textarea
              name="customizations"
              rows={3}
              value={form.customizations}
              onChange={handleChange}
              placeholder={t.customPh}
              className="input-field resize-none"
            />
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl border border-green-200">
              <CheckCircle size={16} /> {t.success}
            </div>
          )}
          {status === "error" && (
            <div className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</div>
          )}

          <button type="submit" disabled={status === "loading" || status === "success"} className="btn-primary w-full disabled:opacity-50">
            {status === "loading" ? (
              <><Loader2 size={18} className="animate-spin" />{t.sending}</>
            ) : (
              <><Send size={18} />{t.submit}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
