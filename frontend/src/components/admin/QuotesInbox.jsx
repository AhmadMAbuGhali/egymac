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
import { TableSkeleton } from "./Skeleton.jsx";
import "../../styles/inquiryWorkspace.css";

const STATUS_LABELS = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
};

function StatusBadge({ status }) {
  const key = STATUS_LABELS[status] ? status : "new";
  return <span className={`inquiry-status-badge inquiry-status-badge--${key}`}>{STATUS_LABELS[key]}</span>;
}

function InquiryDetail({ inquiry, adminKey, onBack, onUpdated }) {
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
        Back to Inbox
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold text-[#3b767c] uppercase tracking-wide mb-1">Inquiry #{detail.id}</p>
          <h2 className="text-xl font-bold text-ink">{detail.companyName}</h2>
          <p className="text-sm font-semibold text-ink-body mt-1">{detail.productName}</p>
        </div>
        <StatusBadge status={detail.status} />
      </div>

      {error ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <div className="inquiry-detail-grid">
        <div className="inquiry-panel">
          <p className="inquiry-panel__title">Sender Details</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 font-semibold text-ink">
              <Building2 size={16} className="text-[#3b767c]" />
              {detail.contactPerson}
            </li>
            <li className="flex items-center gap-2 font-semibold text-ink">
              <Mail size={16} className="text-[#3b767c]" />
              <a href={`mailto:${detail.email}`} className="text-[#3b767c] hover:underline">
                {detail.email}
              </a>
            </li>
            {detail.phone ? (
              <li className="flex items-center gap-2 font-semibold text-ink">
                <Phone size={16} className="text-[#3b767c]" />
                <a href={`tel:${detail.phone}`} className="text-[#3b767c] hover:underline">
                  {detail.phone}
                </a>
              </li>
            ) : null}
            <li className="flex items-center gap-2 font-semibold text-ink">
              <Package size={16} className="text-[#3b767c]" />
              Qty: {detail.quantity || "—"}
            </li>
            <li className="flex items-center gap-2 font-semibold text-ink-body text-xs">
              <Clock size={14} className="text-[#3b767c]" />
              {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}
            </li>
          </ul>
        </div>

        <div className="inquiry-panel">
          <p className="inquiry-panel__title">Message & Specifications</p>
          <p className="text-sm font-semibold text-ink leading-relaxed whitespace-pre-wrap">
            {detail.customizations || "No additional specifications provided."}
          </p>
        </div>
      </div>

      <div className="inquiry-panel mt-4">
        <p className="inquiry-panel__title">Status & Actions</p>
        <div className="inquiry-action-bar">
          {Object.keys(STATUS_LABELS).map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving}
              onClick={() => setStatus(s)}
              className={`inquiry-status-btn ${detail.status === s ? "inquiry-status-btn--active" : ""}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="inquiry-panel mt-4">
        <p className="inquiry-panel__title flex items-center gap-2">
          <MessageSquare size={14} />
          Internal Notes
        </p>
        {(detail.internalNotes || []).length === 0 ? (
          <p className="text-sm font-semibold text-ink-body">No internal notes yet.</p>
        ) : (
          <div className="mb-4">
            {detail.internalNotes.map((n) => (
              <div key={n.id} className="inquiry-note">
                <p className="inquiry-note__meta">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Note"}
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
            placeholder="Log an internal note or reply summary…"
            className="input-field flex-1 font-semibold"
          />
          <button type="submit" disabled={saving || !note.trim()} className="btn-primary text-sm py-2.5 shrink-0">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Add Note"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuotesInbox({ adminKey }) {
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
          <span className="font-bold text-ink">{inquiries.length}</span> RFQ submissions
        </p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover hover:bg-accent-light font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-200"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {inquiries.length === 0 ? (
        <p className="text-ink-body font-semibold text-center py-12">No inquiries received yet.</p>
      ) : (
        <div className="overflow-x-auto custom-scroll rounded-xl border border-border/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <table className="elite-table text-sm min-w-[720px]">
            <thead>
              <tr className="text-left">
                <th>Status</th>
                <th>Date</th>
                <th>Product</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Email / Phone</th>
                <th>Qty</th>
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
                    <StatusBadge status={q.status} />
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
