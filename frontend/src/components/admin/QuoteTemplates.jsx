import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Loader2, LayoutTemplate, CheckCircle2 } from "lucide-react";
import {
  getQuoteTemplates,
  getQuoteTemplate,
  saveQuoteTemplate,
  deleteQuoteTemplate,
} from "../../api/client.js";
import { resolveTemplateId } from "../../utils/quoteBlueprintPayload.js";
import { PanelSkeleton } from "./Skeleton.jsx";

const STYLE_OPTIONS = [
  { value: "standard", label: "Standard Offer" },
  { value: "replica", label: "Replica / Visual" },
  { value: "machinery_detailed", label: "Machinery Detailed" },
];

export default function QuoteTemplates({ adminKey }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [payloadSummary, setPayloadSummary] = useState(null);
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    category: "general",
    templateStyle: "standard",
  });

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!adminKey) return;
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await getQuoteTemplates(adminKey);
        setTemplates(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [adminKey]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectTemplate = async (template) => {
    const id = resolveTemplateId(template);
    if (id == null) return;

    setSelectedId(id);
    setError("");
    setPayloadSummary(null);
    try {
      const res = await getQuoteTemplate(id, adminKey);
      const t = res.data;
      setForm({
        name: t.name || "",
        nameAr: t.nameAr || "",
        description: t.description || "",
        category: t.category || "general",
        templateStyle: t.templateStyle || "standard",
      });
      const p = t.payload;
      if (p) {
        setPayloadSummary({
          technicalRows: p.technicalSpecs?.length ?? 0,
          commercialRows: p.commercialTerms?.length ?? 0,
          machineryItems: p.machineryItems?.length ?? 0,
          attachments: p.visualAttachments?.length ?? 0,
        });
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setPayloadSummary(null);
    setForm({ name: "", nameAr: "", description: "", category: "general", templateStyle: "standard" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Template name is required.");
      return;
    }
    if (!selectedId) {
      setError(
        "New blueprints must be created from Price Offers → Save as Blueprint Template. This panel edits existing template metadata only."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const existing = await getQuoteTemplate(selectedId, adminKey);
      const payload = existing.data.payload;
      if (!payload) {
        setError("This template has no quote payload yet. Re-save it from the Price Offers builder.");
        return;
      }
      await saveQuoteTemplate({ id: selectedId, ...form, payload }, adminKey);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      await load({ silent: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template, event) => {
    event?.stopPropagation();
    event?.preventDefault();

    const templateId = resolveTemplateId(template);
    if (templateId == null) {
      setError("Invalid template id — cannot delete.");
      return;
    }
    if (!adminKey) {
      setError("Admin session required. Please log in again.");
      return;
    }
    if (!window.confirm("Delete this template permanently?")) return;

    setDeletingId(templateId);
    setError("");

    const previous = templates;
    setTemplates((list) => list.filter((t) => String(resolveTemplateId(t)) !== String(templateId)));
    if (String(selectedId) === String(templateId)) {
      handleNew();
    }

    try {
      await deleteQuoteTemplate(templateId, adminKey);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setTemplates(previous);
      setError(e.message || "Failed to delete template.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <PanelSkeleton rows={6} />;

  return (
    <div className="font-[Cairo,system-ui,sans-serif]">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-[#3b767c] mb-2">
          <LayoutTemplate size={22} />
          <h2 className="text-xl font-bold text-ink">قوالب العروض الجاهزة</h2>
        </div>
        <p className="text-sm font-semibold text-neutral-900">
          Blueprint templates store the full live quote schema — tables, terms, machinery rows, and layout settings.
          Use <strong>Price Offers → Save as Blueprint Template</strong> for production-ready snapshots.
        </p>
      </header>

      {error ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{error}</p>
      ) : null}
      {success ? (
        <p className="text-green-700 text-sm bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} /> Saved
        </p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
        <div className="rounded-2xl border border-border/70 bg-surface p-4 space-y-2 max-h-[28rem] overflow-y-auto custom-scroll">
          <button type="button" onClick={handleNew} className="btn-outline w-full text-sm py-2 mb-2">
            <Plus size={16} /> Clear Selection
          </button>
          {templates.length === 0 ? (
            <p className="text-sm font-semibold text-neutral-800 text-center py-8">No templates yet.</p>
          ) : (
            templates.map((t) => {
              const templateId = resolveTemplateId(t);
              const isDeleting = String(deletingId) === String(templateId);
              return (
                <div
                  key={templateId}
                  className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                    String(selectedId) === String(templateId)
                      ? "border-[#3b767c] bg-[#e9f3f4]"
                      : "border-border/70 hover:border-[#3b767c]/30"
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => selectTemplate(t)}
                  >
                    <p className="font-bold text-ink truncate">{t.name}</p>
                    <p className="text-xs font-semibold text-ink-body">{t.templateStyle}</p>
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(event) => handleDelete(t, event)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0 disabled:opacity-50"
                    aria-label={`Delete template ${t.name}`}
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-5 space-y-4">
          <p className="text-xs font-bold text-[#3b767c] uppercase tracking-wide">
            {selectedId ? `Edit Template #${selectedId}` : "Select a Template"}
          </p>
          {payloadSummary ? (
            <div className="rounded-xl border border-[#3b767c]/20 bg-[#e9f3f4]/60 px-3 py-2 text-xs font-semibold text-neutral-900 space-y-1">
              <p>Technical rows: {payloadSummary.technicalRows}</p>
              <p>Commercial terms: {payloadSummary.commercialRows}</p>
              {payloadSummary.machineryItems > 0 ? <p>Machinery items: {payloadSummary.machineryItems}</p> : null}
              {payloadSummary.attachments > 0 ? <p>Visual attachments: {payloadSummary.attachments}</p> : null}
            </div>
          ) : selectedId ? (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              This template has no saved payload. Create it from Price Offers → Save as Blueprint Template.
            </p>
          ) : null}
          {["name", "nameAr", "description", "category"].map((field) => (
            <div key={field}>
              <label className="block text-[10px] font-bold text-ink mb-1 uppercase">{field}</label>
              {field === "description" ? (
                <textarea
                  className="input-field font-semibold resize-none"
                  rows={3}
                  value={form.description}
                  disabled={!selectedId}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              ) : (
                <input
                  className="input-field font-semibold"
                  dir={field === "nameAr" ? "rtl" : "ltr"}
                  value={form[field]}
                  disabled={!selectedId}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-ink mb-1 uppercase">Layout Style</label>
            <select
              className="input-field font-semibold"
              value={form.templateStyle}
              disabled={!selectedId}
              onChange={(e) => setForm((f) => ({ ...f, templateStyle: e.target.value }))}
            >
              {STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs font-semibold text-neutral-800">
            Tip: Build the offer in <strong>Price Offers</strong>, then use{" "}
            <strong>حفظ كقالب جاهز / Save as Blueprint Template</strong> to capture every field identically.
          </p>
          <button type="button" onClick={handleSave} disabled={saving || !selectedId} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Metadata
          </button>
        </div>
      </div>
    </div>
  );
}
