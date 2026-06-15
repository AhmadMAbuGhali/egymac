import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Loader2, Users, X, UserCircle2 } from "lucide-react";
import { getSalespersons, createSalesperson, deleteSalesperson } from "../../api/client.js";

function SalespersonDrawerSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className="sp-profile-row animate-pulse"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="sp-profile-avatar bg-slate-200 text-transparent">—</span>
            <span className="h-4 flex-1 max-w-[12rem] rounded-lg bg-slate-200" />
          </div>
          <span className="w-8 h-8 rounded-lg bg-slate-100" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Slide-over drawer for sales team management (يمين الشاشة).
 * Rendered via portal on document.body to escape overflow/stacking contexts.
 */
export default function SalespersonManager({ adminKey, open, onClose, onRosterChange }) {
  const [roster, setRoster] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [mounted, setMounted] = useState(false);

  const onRosterChangeRef = useRef(onRosterChange);
  onRosterChangeRef.current = onRosterChange;

  const handleClose = useCallback(() => {
    try {
      onClose?.();
    } catch {
      /* never leave user trapped on blur */
    }
  }, [onClose]);

  const loadRoster = useCallback(async () => {
    if (!adminKey) {
      setRoster([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getSalespersons(adminKey);
      const list = Array.isArray(res?.data) ? res.data : [];
      setRoster(list);
      onRosterChangeRef.current?.(list);
    } catch (e) {
      setError(e?.message || "تعذر تحميل قائمة مسؤولي البيع.");
      setRoster([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadRoster();
  }, [open, loadRoster]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, handleClose]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !adminKey) return;
    setSaving(true);
    setError("");
    try {
      await createSalesperson(trimmed, adminKey);
      setName("");
      await loadRoster();
    } catch (err) {
      setError(err?.message || "تعذر إضافة مسؤول البيع.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (id == null || !adminKey) return;
    setRemovingId(id);
    setError("");
    try {
      await deleteSalesperson(id, adminKey);
      await loadRoster();
    } catch (err) {
      setError(err?.message || "تعذر حذف مسؤول البيع.");
    } finally {
      setRemovingId(null);
    }
  };

  const initials = (label) =>
    String(label || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("");

  const safeRoster = Array.isArray(roster) ? roster : [];

  if (!open || !mounted) return null;

  const drawer = (
    <div className="sp-drawer-root" role="presentation">
      <button
        type="button"
        className="sp-drawer-backdrop"
        onClick={handleClose}
        aria-label="إغلاق لوحة إدارة الفريق"
      />

      <aside
        className="sp-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sp-drawer-header">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#3b767c]/10 text-[#3b767c]">
              <Users size={20} aria-hidden />
            </span>
            <div>
              <h2 id="sp-drawer-title" className="text-base font-bold text-slate-800 leading-relaxed">
                إدارة مسؤولي البيع
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                {loading ? "جاري التحميل…" : `${safeRoster.length} عضو${safeRoster.length === 1 ? "" : "اً"} نشط`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </header>

        <div className="sp-drawer-body">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="sp-floating-field">
              <label htmlFor="sp-new-name" className="sp-floating-label">
                اسم مسؤول البيع
              </label>
              <input
                id="sp-new-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                dir="rtl"
                autoComplete="off"
                disabled={saving}
              />
            </div>
            <button
              type="submit"
              disabled={saving || loading || !name.trim()}
              className="archive-toolbar-btn archive-toolbar-btn--primary w-full justify-center disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              إضافة مسؤول بيع جديد
            </button>
          </form>

          {error && (
            <p
              className="text-red-600 text-xs leading-relaxed bg-red-50 rounded-xl px-4 py-3"
              role="alert"
            >
              {error}
            </p>
          )}

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              الفريق الحالي
            </p>

            {loading ? (
              <SalespersonDrawerSkeleton />
            ) : safeRoster.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                <UserCircle2 size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 leading-relaxed">
                  لا يوجد مسؤولو بيع بعد.
                  <br />
                  أضف أول عضو من النموذج أعلاه.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {safeRoster.map((sp) => {
                  if (!sp || sp.id == null) return null;
                  const displayName = sp.name || "—";
                  return (
                    <li key={sp.id} className="sp-profile-row">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="sp-profile-avatar" aria-hidden>
                          {initials(displayName)}
                        </span>
                        <span
                          className="text-sm font-semibold text-slate-700 truncate leading-relaxed"
                          dir="rtl"
                        >
                          {displayName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(sp.id)}
                        disabled={removingId === sp.id}
                        className="sp-delete-btn transition-all duration-200"
                        title="حذف"
                        aria-label={`حذف ${displayName}`}
                      >
                        {removingId === sp.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <footer className="sp-drawer-footer">
          <button
            type="button"
            onClick={handleClose}
            className="archive-toolbar-btn archive-toolbar-btn--ghost w-full justify-center transition-all duration-200"
          >
            تم
          </button>
        </footer>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

/** Compact trigger button for opening the drawer */
export function SalespersonManagerTrigger({ onClick, count = 0, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="archive-toolbar-btn archive-toolbar-btn--ghost transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
    >
      <Users size={16} />
      إدارة الفريق
      {count > 0 && <span className="archive-count-badge">{count}</span>}
    </button>
  );
}
