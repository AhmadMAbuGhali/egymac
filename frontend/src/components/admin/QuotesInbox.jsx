import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Package,
  Clock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { getInquiries, patchInquiry } from "../../api/client.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { TableSkeleton } from "./Skeleton.jsx";
import "../../styles/inquiryWorkspace.css";

const STATUS_LABELS = {
  en: { new: "New", in_progress: "In Progress", resolved: "Resolved" },
  ar: { new: "جديد", in_progress: "قيد المتابعة", resolved: "تم الحل" },
};

const INQUIRY_COPY = {
  en: {
    back: "Back to Inbox",
    sender: "Sender Details",
    message: "Message & Specifications",
    status: "Status & Actions",
    notes: "Internal Notes",
    noNotes: "No internal notes yet.",
    noSpecs: "No additional specifications provided.",
    addNote: "Add Note",
    notePlaceholder: "Log an internal note or reply summary…",
    qty: "Qty",
    inbox: "Inquiries Inbox",
    refresh: "Refresh",
    empty: "No inquiries yet.",
    company: "Company",
    contact: "Contact",
    product: "Product",
    date: "Date",
  },
  ar: {
    back: "رجوع للوارد",
    sender: "بيانات المرسل",
    message: "الرسالة والمواصفات",
    status: "الحالة والإجراءات",
    notes: "ملاحظات داخلية",
    noNotes: "لا توجد ملاحظات بعد.",
    noSpecs: "لم تُذكر مواصفات إضافية.",
    addNote: "إضافة ملاحظة",
    notePlaceholder: "سجّل ملاحظة داخلية أو ملخص رد…",
    qty: "الكمية",
    inbox: "صندوق الوارد",
    refresh: "تحديث",
    empty: "لا توجد استفسارات.",
    company: "الشركة",
    contact: "جهة الاتصال",
    product: "المنتج",
    date: "التاريخ",
  },
};

function StatusBadge({ status, lang }) {
  const key = STATUS_LABELS[lang][status] ? status : "new";
  return (
    <span className={`inquiry-status-badge inquiry-status-badge--${key}`}>
      {STATUS_LABELS[lang][key]}
    </span>
  );
}

function InquiryDetail({ inquiry, adminKey, onBack, onUpdated, lang }) {
  const copy = INQUIRY_COPY[lang];
  const [detail, setDetail] = useState(inquiry);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDetail(inquiry);
  }, [inquiry]);

  const setStatus = async (status) => {
    setSaving(true);
    setError("");
    try {
      const res = await patchInquiry(detail.id, { status }, adminKey);
      setDetail(res.data);
      onUpdated?.(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await patchInquiry(detail.id, { note: note.trim() }, adminKey);
      setDetail(res.data);
      setNote("");
      onUpdated?.(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inquiry-detail-shell inquiry-workspace">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-[#3b767c] hover:bg-[#e9f3f4] px-3 py-2 rounded-lg mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        {copy.back}
      </button>

      <div className="inquiry-detail-hero">
        <div className="inquiry-detail-hero__main">
          <p className="inquiry-detail-hero__id">#{detail.id}</p>
          <h2 className="inquiry-detail-hero__title">{detail.companyName}</h2>
          <p className="inquiry-detail-hero__product">{detail.productName}</p>
        </div>
        <StatusBadge status={detail.status} lang={lang} />
      </div>

      {error ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <div className="inquiry-detail-grid">
        <div className="inquiry-panel inquiry-panel--crm">
          <p className="inquiry-panel__title">{copy.sender}</p>
          <ul className="inquiry-meta-list">
            <li className="inquiry-meta-list__item">
              <Building2 size={16} className="inquiry-meta-list__icon" />
              <span>{detail.contactPerson}</span>
            </li>
            <li className="inquiry-meta-list__item">
              <Mail size={16} className="inquiry-meta-list__icon" />
              <a href={`mailto:${detail.email}`} className="inquiry-meta-list__link">
                {detail.email}
              </a>
            </li>
            {detail.phone ? (
              <li className="inquiry-meta-list__item">
                <Phone size={16} className="inquiry-meta-list__icon" />
                <a href={`tel:${detail.phone}`} className="inquiry-meta-list__link" dir="ltr" style={{ unicodeBidi: "isolate" }}>
                  {detail.phone}
                </a>
              </li>
            ) : null}
            <li className="inquiry-meta-list__item">
              <Package size={16} className="inquiry-meta-list__icon" />
              <span>{copy.qty}: {detail.quantity || "—"}</span>
            </li>
            <li className="inquiry-meta-list__item inquiry-meta-list__item--muted">
              <Clock size={14} className="inquiry-meta-list__icon" />
              <span>{detail.createdAt ? new Date(detail.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB") : "—"}</span>
            </li>
          </ul>
        </div>

        <div className="inquiry-panel inquiry-panel--crm">
          <p className="inquiry-panel__title">{copy.message}</p>
          <p className="inquiry-message-body">
            {detail.customizations || copy.noSpecs}
          </p>
        </div>
      </div>

      <div className="inquiry-panel mt-4 inquiry-panel--crm">
        <p className="inquiry-panel__title">{copy.status}</p>
        <div className="inquiry-action-bar">
          {Object.keys(STATUS_LABELS[lang]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving}
              onClick={() => setStatus(s)}
              className={`inquiry-status-btn ${detail.status === s ? "inquiry-status-btn--active" : ""}`}
            >
              {STATUS_LABELS[lang][s]}
            </button>
          ))}
        </div>
      </div>

      <div className="inquiry-panel mt-4 inquiry-panel--crm">
        <p className="inquiry-panel__title flex items-center gap-2">
          <MessageSquare size={14} />
          {copy.notes}
        </p>
        {(detail.internalNotes || []).length === 0 ? (
          <p className="text-sm font-semibold text-ink-body">{copy.noNotes}</p>
        ) : (
          <div className="mb-4">
            {detail.internalNotes.map((n) => (
              <div key={n.id} className="inquiry-note">
                <p className="inquiry-note__meta">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB") : "Note"}
                </p>
                <p className="inquiry-note__body">{n.body}</p>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addNote} className="flex flex-col sm:flex-row gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={copy.notePlaceholder}
            className="input-field flex-1 font-semibold"
          />
          <button type="submit" disabled={saving || !note.trim()} className="btn-primary text-sm py-2.5 shrink-0">
            {saving ? <Loader2 size={16} className="animate-spin" /> : copy.addNote}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuotesInbox({ adminKey }) {
  const { lang } = useLanguage();
  const copy = INQUIRY_COPY[lang];
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeInquiryId, setActiveInquiryId] = useState(null);

  const load = useCallback(() => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    getInquiries(adminKey)
      .then((r) => setInquiries(Array.isArray(r.data) ? r.data : []))
      .catch((e) => setError(e.message || "Failed to load inquiries."))
      .finally(() => setLoading(false));
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const activeInquiry = inquiries.find((q) => String(q.id) === String(activeInquiryId));

  if (loading) return <TableSkeleton rows={6} cols={7} />;

  if (error && !inquiries.length) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm" role="alert">
        {error}
        <button type="button" onClick={load} className="block mt-2 text-accent font-semibold hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (activeInquiryId && activeInquiry) {
    return (
      <InquiryDetail
        inquiry={activeInquiry}
        adminKey={adminKey}
        lang={lang}
        onBack={() => setActiveInquiryId(null)}
        onUpdated={(updated) =>
          setInquiries((prev) => prev.map((q) => (String(q.id) === String(updated.id) ? updated : q)))
        }
      />
    );
  }

  return (
    <div className="inquiry-workspace">
      <div className="flex justify-between items-center mb-6">
        <p className="text-ink-body text-sm font-semibold">
          <span className="font-bold text-ink">{inquiries.length}</span> {copy.inbox}
        </p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover hover:bg-accent-light font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-200"
        >
          <RefreshCw size={14} /> {copy.refresh}
        </button>
      </div>

      {inquiries.length === 0 ? (
        <p className="text-ink-body font-semibold text-center py-12">{copy.empty}</p>
      ) : (
        <div className="overflow-x-auto custom-scroll rounded-xl border border-border/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <table className="elite-table text-sm min-w-[720px]">
            <thead>
              <tr className="text-left">
                <th>{copy.status}</th>
                <th>{copy.date}</th>
                <th>{copy.product}</th>
                <th>{copy.company}</th>
                <th>{copy.contact}</th>
                <th>Email / Phone</th>
                <th>{copy.qty}</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((q) => (
                <tr
                  key={q.id}
                  className="inquiry-list-row align-top"
                  onClick={() => setActiveInquiryId(q.id)}
                >
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} lang={lang} />
                  </td>
                  <td className="px-4 py-3 text-ink text-xs font-semibold whitespace-nowrap">
                    {q.createdAt ? new Date(q.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-accent">{q.productName || "—"}</td>
                  <td className="px-4 py-3 text-ink font-bold">{q.companyName || "—"}</td>
                  <td className="px-4 py-3 text-ink font-semibold">{q.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-ink text-xs font-semibold">
                    <div>{q.email || "—"}</div>
                    {q.phone && <div className="text-ink-body mt-0.5">{q.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink font-bold">{q.quantity || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
