import { useState, useRef } from "react";
import {
  Upload,
  FilePlus2,
  Download,
  Printer,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useQuotation } from "../../hooks/useQuotation.js";
import { parseQuotationPdf, generateQuotationPdf, getQuotationTemplate } from "../../api/client.js";
import QuotationItemsGrid from "./QuotationItemsGrid.jsx";
import QuotationPreview from "./QuotationPreview.jsx";

export default function QuotationGenerator({ adminKey }) {
  const { lang } = useLanguage();
  const fileRef = useRef(null);
  const {
    quotation,
    parseInfo,
    grandTotal,
    loadQuotation,
    resetQuotation,
    updateClient,
    updateCommercial,
    updateField,
    updateItem,
    addItem,
    removeItem,
  } = useQuotation();

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const L = {
    en: {
      title: "B2B Price Offer Generator",
      subtitle: "Upload, edit, and export official Egy Mac quotations",
      upload: "Upload Existing Quotation PDF",
      uploadHint: "Drag & drop or click to upload — text will be extracted into the form",
      scratch: "Create from Scratch",
      client: "Client Information",
      company: "Company Name",
      location: "Project Location",
      attention: "Attention To (Procurement Manager)",
      commercial: "Commercial Terms",
      delivery: "Delivery Time",
      payment: "Payment Terms",
      warranty: "Warranty Period",
      validity: "Offer Validity",
      notes: "Additional Notes",
      ref: "Reference No.",
      date: "Date",
      generate: "Download PDF Offer",
      print: "Print Preview",
      preview: "Live Preview",
      edit: "Edit Form",
    },
    ar: {
      title: "منظومة إنشاء عروض الأسعار",
      subtitle: "رفع وتعديل وتصدير عروض أسعار إيجي ماك الرسمية",
      upload: "رفع عرض سعر PDF موجود",
      uploadHint: "اسحب وأفلت أو انقر للرفع — سيتم استخراج النص إلى النموذج",
      scratch: "إنشاء من الصفر",
      client: "بيانات العميل",
      company: "اسم الشركة",
      location: "موقع المشروع",
      attention: "عناية السيد / مدير المشتريات",
      commercial: "الشروط التجارية",
      delivery: "مدة التسليم",
      payment: "شروط الدفع",
      warranty: "فترة الضمان",
      validity: "صلاحية العرض",
      notes: "ملاحظات إضافية",
      ref: "رقم المرجع",
      date: "التاريخ",
      generate: "تحميل PDF",
      print: "طباعة",
      preview: "معاينة",
      edit: "تحرير",
    },
  }[lang];

  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError(lang === "en" ? "Please upload a PDF file." : "يرجى رفع ملف PDF.");
      return;
    }
    setUploading(true);
    setError("");
    setStatus(null);
    try {
      const res = await parseQuotationPdf(file, adminKey);
      loadQuotation(res.data, res.rawTextPreview);
      setStatus("parsed");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleScratch = async () => {
    setError("");
    try {
      const res = await getQuotationTemplate(adminKey);
      loadQuotation(res.data);
      setStatus("scratch");
    } catch {
      resetQuotation();
      setStatus("scratch");
    }
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    setError("");
    try {
      const blob = await generateQuotationPdf(quotation, adminKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EgyMac-Offer-${quotation.referenceNumber || "draft"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("generated");
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById("quotation-print-root");
    if (!el) return;
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>Egy Mac Price Offer</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #333333; background: #ffffff; }
        .h-1 { height: 4px; background: #3B767C; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
        th { background: #F2F5F5; color: #52585A; }
        .accent { color: #3B767C; font-weight: bold; }
      </style></head><body>${el.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">{L.title}</h2>
        <p className="text-sm text-ink-body mt-1">{L.subtitle}</p>
      </div>

      {/* Upload + scratch actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`card p-6 border-2 border-dashed cursor-pointer transition-colors ${
            dragOver ? "border-accent bg-accent-light/50" : "border-border hover:border-accent/50 hover:bg-surface-muted"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center text-center gap-3 py-4">
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-accent" />
            ) : (
              <Upload size={32} className="text-accent" />
            )}
            <div>
              <p className="font-semibold text-ink text-sm">{L.upload}</p>
              <p className="text-xs text-ink-muted mt-1">{L.uploadHint}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleScratch}
          className="card p-6 flex flex-col items-center justify-center gap-3 hover:border-accent/50 hover:bg-surface-muted transition-colors"
        >
          <FilePlus2 size={32} className="text-accent" />
          <span className="font-semibold text-ink text-sm">{L.scratch}</span>
        </button>
      </div>

      {parseInfo && (
        <div className="text-xs text-ink-muted bg-surface-muted border border-border rounded-lg p-3 font-mono truncate">
          PDF preview: {parseInfo.slice(0, 120)}…
        </div>
      )}

      {status === "parsed" && (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <CheckCircle size={16} /> PDF parsed — review and edit fields below
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Toggle preview / form on mobile */}
      <div className="flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${!showPreview ? "bg-accent text-secondary" : "bg-surface-muted text-ink-body"}`}
        >
          {L.edit}
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${showPreview ? "bg-accent text-secondary" : "bg-surface-muted text-ink-body"}`}
        >
          {L.preview}
        </button>
      </div>

      <div className="grid xl:grid-cols-2 gap-8">
        {/* Form builder */}
        <div className={`space-y-6 ${showPreview ? "hidden xl:block" : ""}`}>
          {/* Meta */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">{L.ref}</label>
              <input value={quotation.referenceNumber} onChange={(e) => updateField("referenceNumber", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">{L.date}</label>
              <input type="date" value={quotation.date} onChange={(e) => updateField("date", e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Client */}
          <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide">{L.client}</h3>
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">{L.company} *</label>
              <input value={quotation.client.companyName} onChange={(e) => updateClient("companyName", e.target.value)} className="input-field" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">{L.location}</label>
                <input value={quotation.client.projectLocation} onChange={(e) => updateClient("projectLocation", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">{L.attention}</label>
                <input value={quotation.client.attentionTo} onChange={(e) => updateClient("attentionTo", e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          {/* Items grid */}
          <QuotationItemsGrid
            items={quotation.items}
            currency={quotation.currency}
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onCurrencyChange={(v) => updateField("currency", v)}
          />

          {/* Commercial terms */}
          <div className="p-4 rounded-lg bg-surface-muted border border-border space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide">{L.commercial}</h3>
            {[
              ["deliveryTimeline", L.delivery],
              ["paymentTerms", L.payment],
              ["warrantyCertification", lang === "en" ? "German Tech Warranty" : "ضمان التقنية الألمانية"],
              ["validity", L.validity],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-ink-body mb-1">{label}</label>
                <input
                  value={quotation.commercial[key]}
                  onChange={(e) => updateCommercial(key, e.target.value)}
                  className="input-field"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1">{L.notes}</label>
              <textarea value={quotation.notes} onChange={(e) => updateField("notes", e.target.value)} rows={2} className="input-field resize-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={handleGeneratePdf} disabled={generating} className="btn-primary">
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {L.generate}
            </button>
            <button type="button" onClick={handlePrint} className="btn-outline">
              <Printer size={18} /> {L.print}
            </button>
            <div className="ml-auto text-right">
              <p className="text-xs text-ink-muted uppercase">{lang === "en" ? "Grand Total" : "الإجمالي"}</p>
              <p className="text-xl font-bold text-accent">
                {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} {quotation.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className={`${!showPreview ? "hidden xl:block" : ""}`}>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 hidden xl:block">{L.preview}</p>
          <QuotationPreview quotation={quotation} grandTotal={grandTotal} />
        </div>
      </div>
    </div>
  );
}
