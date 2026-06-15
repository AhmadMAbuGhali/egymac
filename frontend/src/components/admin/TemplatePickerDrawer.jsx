import { useState, useEffect, useCallback } from "react";
import { X, Loader2, LayoutTemplate } from "lucide-react";
import { getQuoteTemplates, getQuoteTemplate } from "../../api/client.js";

export default function TemplatePickerDrawer({ open, adminKey, onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await getQuoteTemplates(adminKey);
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handlePick = async (id) => {
    setLoadingId(id);
    setError("");
    try {
      const res = await getQuoteTemplate(id, adminKey);
      onSelect?.(res.data);
      onClose?.();
    } catch (e) {
      setError(e.message || "Failed to load template.");
    } finally {
      setLoadingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-[slideInRight_0.28s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-[#3b767c]">
            <LayoutTemplate size={20} />
            <h3 className="font-black text-neutral-950">تحميل من قالب / Load From Template</h3>
            <p className="text-xs font-semibold text-neutral-800 mt-1">
              Hydrates every row, table, and layout setting into the active workspace.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-accent-light">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-3">
          {error ? (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          ) : null}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-accent" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm font-semibold text-ink-body text-center py-12">No templates yet.</p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={loadingId != null}
                onClick={() => handlePick(t.id)}
                className="w-full text-left rounded-xl border border-border/80 p-4 hover:border-[#3b767c]/40 hover:bg-[#e9f3f4]/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">{t.name}</p>
                    {t.nameAr ? (
                      <p className="text-sm font-semibold text-[#3b767c] mt-0.5" dir="rtl">
                        {t.nameAr}
                      </p>
                    ) : null}
                    {t.description ? (
                      <p className="text-xs font-semibold text-ink-body mt-2 line-clamp-2">{t.description}</p>
                    ) : null}
                  </div>
                  {loadingId === t.id ? <Loader2 size={18} className="animate-spin text-accent shrink-0" /> : null}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink mt-2">
                  {t.templateStyle || "standard"} · {t.category || "general"}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
