import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Trash2,
  Download,
  Save,
  FilePlus2,
  Loader2,
  CheckCircle,
  AlertCircle,
  LayoutTemplate,
} from "lucide-react";
import { useFreeFormQuote } from "../../hooks/useFreeFormQuote.js";
import {
  getSavedQuote,
  getFreeFormQuoteTemplate,
  saveFreeFormQuote,
  getSalespersons,
  saveQuoteTemplate,
} from "../../api/client.js";
import TemplatePickerDrawer from "./TemplatePickerDrawer.jsx";
import SignatureDeskPreview from "./SignatureDeskPreview.jsx";
import { buildFixedSignatureBlocks } from "../../constants/signatures.js";
import FreeFormQuotePreview from "./FreeFormQuotePreview.jsx";
import MachineryQuotePreview from "./MachineryQuotePreview.jsx";
import MachineryItemsPanel from "./MachineryItemsPanel.jsx";
import VisualAttachmentsPanel from "./VisualAttachmentsPanel.jsx";
import PrintOptimizerBar, { PRINT_MODE_COMPACT } from "./PrintOptimizerBar.jsx";
import WorkspaceSection from "./WorkspaceSection.jsx";
import { QuoteEditProvider } from "./inlineEdit.jsx";
import {
  createDefaultSectionVisibility,
  mergeSectionVisibility,
} from "../../constants/quoteSectionVisibility.js";
import { createMachinerySeed } from "../../constants/machineryQuote.js";
import {
  useQuoteDraftPersistence,
  getRestorableDraft,
  markDraftPromptHandled,
  discardDraftSession,
  isDraftPromptDismissed,
  draftStorageKey,
  draftPromptKey,
} from "../../hooks/useQuoteDraftPersistence.js";
import {
  buildQuoteBlueprintPayload,
  buildTemplateBlueprintPayload,
  hydrateBuilderFromTemplatePayload,
} from "../../utils/quoteBlueprintPayload.js";
import "../../styles/freeFormQuote.print.css";
import "../../styles/quoteWorkspace.css";

function syncUiFromLoadedQuote(
  data,
  { setTemplateStyle, setVisualAttachments, setSectionVisibility }
) {
  let style = data.templateStyle || "standard";
  // Legacy replica snapshots render on the Heavy Machinery layout
  if (style === "replica") style = "machinery_detailed";
  const attachments = Array.isArray(data.visualAttachments) ? data.visualAttachments : [];
  setTemplateStyle(style);
  setVisualAttachments(attachments);
  setSectionVisibility(mergeSectionVisibility(data.sectionVisibility));
}

function ColumnHeaderInputs({ columns, keys, labels, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-2">
      {keys.map((key, i) => (
        <div key={key}>
          <label className="block text-[10px] font-bold text-ink mb-1 uppercase">
            {labels[i]}
          </label>
          <input
            value={columns[key] || ""}
            onChange={(e) => onChange(key, e.target.value)}
            className="input-field py-1.5 text-xs font-bold text-accent border-accent/30 focus:border-accent"
            dir="rtl"
          />
        </div>
      ))}
    </div>
  );
}

export default function FreeFormQuoteGenerator({ adminKey }) {
  const location = useLocation();
  const {
    quote,
    savedId,
    setSavedId,
    loadQuote,
    loadQuoteFork,
    resetQuote,
    updateField,
    updateTechColumn,
    updateCommColumn,
    updateFooter,
    addFooterLine,
    updateFooterLine,
    removeFooterLine,
    updateSpec,
    addSpec,
    removeSpec,
    updateTerm,
    addTerm,
    removeTerm,
    updateSignature,
    addSignature,
    removeSignature,
    updateGreetingPart,
    updateMachineryInline,
  } = useFreeFormQuote();

  const [salespersonRoster, setSalespersonRoster] = useState([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [printMode, setPrintMode] = useState(PRINT_MODE_COMPACT);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [blueprintSaving, setBlueprintSaving] = useState(false);
  const [blueprintSuccess, setBlueprintSuccess] = useState("");
  const [blueprintForm, setBlueprintForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    keepClientName: true,
  });
  const [sectionVisibility, setSectionVisibility] = useState(createDefaultSectionVisibility);

  // Optional image attachments — available on all layout styles
  const [visualAttachments, setVisualAttachments] = useState([]);

  const [templateStyle, setTemplateStyle] = useState("standard");
  const isClassic = templateStyle === "standard";
  /** عرض سعر مصوّر — always the original Heavy Machinery layout */
  const isVisualOffer =
    templateStyle === "machinery_detailed" || templateStyle === "replica";

  const activeAttachments = visualAttachments.length > 0 ? visualAttachments : null;

  const prevTemplateRef = useRef(templateStyle);
  const initialSavedIdRef = useRef(savedId);

  const isDirty = status !== "saved";
  const { clearDraft } = useQuoteDraftPersistence({
    quote,
    sectionVisibility,
    templateStyle,
    visualAttachments,
    savedId,
    dirty: isDirty,
  });

  const loadQuoteRef = useRef(loadQuote);
  loadQuoteRef.current = loadQuote;

  /** Mount-only draft restore — never re-run on tab/workspace navigation remounts */
  useEffect(() => {
    const mountSavedId = initialSavedIdRef.current;
    const draft = getRestorableDraft(mountSavedId);
    if (!draft) return;

    markDraftPromptHandled(mountSavedId);

    const ok = window.confirm(
      "Unsaved quote draft found in this browser session. Restore it? (Cancel to discard the draft.)"
    );

    if (!ok) {
      discardDraftSession(mountSavedId);
      return;
    }

    loadQuoteRef.current(draft.quote);
    if (draft.sectionVisibility) setSectionVisibility(mergeSectionVisibility(draft.sectionVisibility));
    if (draft.templateStyle) {
      setTemplateStyle(draft.templateStyle === "replica" ? "machinery_detailed" : draft.templateStyle);
    }
    if (Array.isArray(draft.visualAttachments)) setVisualAttachments(draft.visualAttachments);
    setStatus("loaded");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on panel mount only
  }, []);

  // Seed machinery assemblies when switching into عرض سعر مصوّر (Heavy Machinery layout)
  useEffect(() => {
    const switchedToMachinery =
      templateStyle === "machinery_detailed" && prevTemplateRef.current !== "machinery_detailed";
    prevTemplateRef.current = templateStyle;

    if (switchedToMachinery && !quote.machineryItems?.length) {
      updateField("machineryItems", createMachinerySeed());
    }
  }, [templateStyle, quote.machineryItems?.length, updateField]);

  /** Universal inline-edit dispatcher — functional updates, no stale closures */
  const handleInlineEdit = useCallback(
    (path, value) => {
      const parts = path.split(".");
      switch (parts[0]) {
        case "field":
          return updateField(parts[1], value);
        case "greetingFirst":
          return updateGreetingPart("first", value);
        case "greetingRest":
          return updateGreetingPart("rest", value);
        case "techCol":
          return updateTechColumn(parts[1], value);
        case "commCol":
          return updateCommColumn(parts[1], value);
        case "footer":
          return updateFooter(parts[1], value);
        case "footerLine":
          return updateFooterLine(Number(parts[1]), value);
        case "spec":
          return updateSpec(Number(parts[1]), parts[2], value);
        case "term":
          return updateTerm(Number(parts[1]), parts[2], value);
        case "sig":
          return updateSignature(Number(parts[1]), parts[2], value);
        case "machine": {
          const itemId = Number(parts[1]);
          if (parts[2] === "spec") {
            return updateMachineryInline(itemId, Number(parts[3]), parts[4], value);
          }
          return updateMachineryInline(itemId, null, parts[2], value);
        }
        default:
          return undefined;
      }
    },
    [
      updateField,
      updateGreetingPart,
      updateTechColumn,
      updateCommColumn,
      updateFooter,
      updateFooterLine,
      updateSpec,
      updateTerm,
      updateSignature,
      updateMachineryInline,
    ]
  );

  const loadSalespersonRoster = useCallback(async () => {
    if (!adminKey) return;
    try {
      const res = await getSalespersons(adminKey);
      setSalespersonRoster(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSalespersonRoster([]);
    }
  }, [adminKey]);

  useEffect(() => {
    loadSalespersonRoster();
  }, [loadSalespersonRoster]);

  const handleSalespersonChange = useCallback(
    (salespersonId) => {
      const id = salespersonId ? Number(salespersonId) : null;
      const sp = salespersonRoster.find((r) => String(r.id) === String(id));
      updateField("salespersonId", id);
      updateField("salespersonName", sp?.name || "");
      updateField("signatures", buildFixedSignatureBlocks(sp?.name || ""));
      setStatus((s) => (s === "saved" ? "loaded" : s));
    },
    [salespersonRoster, updateField]
  );

  const toggleSectionVisibility = useCallback((key, visible) => {
    setSectionVisibility((prev) => ({ ...prev, [key]: visible }));
  }, []);

  const handleNew = async () => {
    setError("");
    try {
      const res = await getFreeFormQuoteTemplate(adminKey);
      loadQuote(res.data);
      syncUiFromLoadedQuote(res.data, {
        setTemplateStyle,
        setVisualAttachments,
        setSectionVisibility,
      });
      setStatus("new");
    } catch {
      resetQuote();
      setSectionVisibility(createDefaultSectionVisibility());
      setStatus("new");
    }
  };

  const handleLoad = async (id) => {
    setError("");
    try {
      const res = await getSavedQuote(id, adminKey);
      loadQuoteFork(res.data);
      syncUiFromLoadedQuote(res.data, {
        setTemplateStyle,
        setVisualAttachments,
        setSectionVisibility,
      });
      setStatus("loaded");
    } catch (e) {
      setError(e.message || "Failed to load saved offer.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = buildQuoteBlueprintPayload(quote, {
        savedId,
        templateStyle,
        visualAttachments,
        sectionVisibility,
        isClassic,
        isVisualOffer,
      });
      const res = await saveFreeFormQuote(payload, adminKey);
      setSavedId(res.data.id);
      loadQuote(res.data);
      syncUiFromLoadedQuote(res.data, {
        setTemplateStyle,
        setVisualAttachments,
        setSectionVisibility,
      });
      setStatus("saved");
      clearDraft();
    } catch (e) {
      setError(e.message || "Failed to save offer.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const editId = location.state?.editQuoteId;
    if (editId == null || !adminKey) return;

    let cancelled = false;
    (async () => {
      setError("");
      try {
        const res = await getSavedQuote(editId, adminKey);
        if (cancelled) return;
        loadQuoteFork(res.data);
        syncUiFromLoadedQuote(res.data, {
          setTemplateStyle,
          setVisualAttachments,
          setSectionVisibility,
        });
        setStatus("loaded");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load saved offer.");
      }
    })();

    window.history.replaceState({}, document.title);
    return () => {
      cancelled = true;
    };
  }, [location.state?.editQuoteId, adminKey, loadQuoteFork]);

  const handleLoadFromTemplate = (templateRow) => {
    const hydrated = hydrateBuilderFromTemplatePayload(templateRow, {
      loadQuoteFork,
      setTemplateStyle,
      setVisualAttachments,
      setSectionVisibility,
      prevTemplateRef,
    });
    if (!hydrated) {
      setError("Template has no saved quote payload. Save a blueprint from Price Offers first.");
      return;
    }
    clearDraft();
    discardDraftSession(null);
    setStatus("loaded");
    setError("");
    setBlueprintSuccess("");
  };

  const openBlueprintModal = () => {
    setBlueprintForm({
      name: quote.documentTitle || "New Blueprint Template",
      nameAr: "قالب عرض جاهز",
      description: `Blueprint snapshot — ${quote.referenceNumber || "draft"}`,
      keepClientName: Boolean(quote.clientName?.trim()),
    });
    setBlueprintSuccess("");
    setBlueprintModalOpen(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!blueprintForm.name?.trim()) {
      setError("Template name is required.");
      return;
    }
    setBlueprintSaving(true);
    setError("");
    try {
      const payload = buildTemplateBlueprintPayload(quote, {
        templateStyle,
        visualAttachments,
        sectionVisibility,
        isClassic,
        isVisualOffer,
        keepClientName: blueprintForm.keepClientName,
      });
      await saveQuoteTemplate(
        {
          name: blueprintForm.name.trim(),
          nameAr: blueprintForm.nameAr.trim(),
          description: blueprintForm.description.trim(),
          category: isVisualOffer ? "premium" : "general",
          templateStyle: isVisualOffer ? "machinery_detailed" : "standard",
          payload,
        },
        adminKey
      );
      setBlueprintModalOpen(false);
      setBlueprintSuccess("Blueprint template saved — full quote schema preserved.");
      setTimeout(() => setBlueprintSuccess(""), 4000);
    } catch (e) {
      setError(e.message || "Failed to save template.");
    } finally {
      setBlueprintSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setError("");
    setPdfGenerating(true);
    try {
      const payload = buildQuoteBlueprintPayload(quote, {
        savedId,
        templateStyle,
        visualAttachments,
        sectionVisibility,
        isClassic,
        isVisualOffer,
      });
      const saveRes = await saveFreeFormQuote(payload, adminKey);
      const saved = saveRes.data;
      setSavedId(saved.id);
      loadQuote(saved);
      syncUiFromLoadedQuote(saved, {
        setTemplateStyle,
        setVisualAttachments,
        setSectionVisibility,
      });
      setStatus("saved");
      clearDraft();

      const { downloadOfferPdfById } = await import("../../utils/generateOfferPdf.js");
      await downloadOfferPdfById({
        quoteId: saved.id,
        printMode,
        adminKey,
        clientName: saved.clientName,
      });
    } catch (e) {
      setError(e.message || "PDF generation failed. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="quote-workspace-root quote-builder-soft offer-generator-root rounded-2xl p-4 sm:p-6">
      <div className="no-print mb-4 segmented-control flex-wrap align-top">
        <span className="px-2.5 py-2 text-xs font-bold text-slate-600 uppercase tracking-wide self-center">
          Layout
        </span>
        <button
          type="button"
          onClick={() => setTemplateStyle("standard")}
          className={`segmented-option ${isClassic ? "segmented-option-active" : ""}`}
        >
          Classic Look — المظهر الكلاسيكي
        </button>
        <button
          type="button"
          onClick={() => setTemplateStyle("machinery_detailed")}
          className={`segmented-option ${isVisualOffer ? "segmented-option-active" : ""}`}
        >
          عرض سعر مصوّر — Visual Photographic Offer
        </button>
      </div>

      <div className="no-print mb-6">
        <h2 className="text-lg font-bold text-slate-800">منظومة إنشاء عروض الأسعار</h2>
        <p className="text-sm text-slate-600 mt-1">
          Dynamic B2B Price Offer Generator — unrestricted control over every document section.
        </p>
      </div>

      <div className="no-print quote-workspace-toolbar flex flex-wrap gap-2 mb-6">
        <button type="button" onClick={handleNew} className="btn-outline text-sm py-2">
          <FilePlus2 size={16} /> New Document
        </button>
        <button type="button" onClick={() => setShowTemplateDrawer(true)} className="btn-outline text-sm py-2">
          <LayoutTemplate size={16} /> Load From Template
        </button>
        <button
          type="button"
          onClick={openBlueprintModal}
          className="quote-blueprint-save-btn text-sm py-2.5 px-4"
        >
          <LayoutTemplate size={18} strokeWidth={2.25} />
          <span className="flex flex-col items-start leading-tight sm:flex-row sm:items-center sm:gap-1">
            <span dir="rtl" className="font-black">حفظ كقالب جاهز</span>
            <span className="text-white/80 font-semibold hidden sm:inline">/</span>
            <span className="font-bold text-white/90">Save as Blueprint Template</span>
          </span>
        </button>
        <button type="button" onClick={handleSave} disabled={saving || pdfGenerating} className="btn-primary text-sm py-2 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "جاري الحفظ…" : "حفظ العرض / Save"}
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={pdfGenerating || saving}
          className="btn-primary text-sm py-2 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
        >
          {pdfGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {pdfGenerating ? "جاري التحميل…" : "تحميل PDF / Download"}
        </button>
      </div>

      <div className="quote-mobile-view-bar no-print">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 active:scale-95 ${
              !showPreview
                ? "bg-accent text-secondary border-accent shadow-accent"
                : "bg-secondary text-ink-body border-border hover:border-accent/40"
            }`}
          >
            تعديل البيانات
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 active:scale-95 ${
              showPreview
                ? "bg-accent text-secondary border-accent shadow-accent"
                : "bg-secondary text-ink-body border-border hover:border-accent/40"
            }`}
          >
            معاينة العرض
          </button>
        </div>
      </div>

      {blueprintSuccess && (
        <div className="no-print flex items-center gap-2 text-[#3b767c] text-sm bg-[#e9f3f4] border border-[#3b767c]/30 rounded-xl px-4 py-3 mb-4 shadow-[0_8px_30px_rgb(59,118,124,0.08)]">
          <CheckCircle size={16} /> {blueprintSuccess}
        </div>
      )}
      {status === "saved" && (
        <div className="no-print flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <CheckCircle size={16} /> Offer saved successfully.
        </div>
      )}
      {error && (
        <div className="no-print flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="quote-workspace-desk">
        <div
          className={`quote-workspace-preview offer-print-host offer-print-scroll ${!showPreview ? "hidden xl:block" : ""}`}
        >
          <p className="no-print text-sm font-extrabold text-neutral-950 uppercase tracking-wide mb-4 hidden xl:block">
            المعاينة الحية — Live Official Preview
          </p>
          <PrintOptimizerBar mode={printMode} onChange={setPrintMode} />
          <QuoteEditProvider onEdit={handleInlineEdit}>
            {isVisualOffer ? (
              <MachineryQuotePreview
                quote={quote}
                printMode={printMode}
                sectionVisibility={sectionVisibility}
              />
            ) : (
              <FreeFormQuotePreview
                quote={quote}
                printMode={printMode}
                visualAttachments={activeAttachments}
                sectionVisibility={sectionVisibility}
              />
            )}
          </QuoteEditProvider>
        </div>

        <div
          className={`quote-workspace-form no-print ${showPreview ? "hidden xl:block" : ""}`}
        >
          <WorkspaceSection
            sectionKey="documentMeta"
            visible={sectionVisibility.documentMeta}
            onToggleVisibility={toggleSectionVisibility}
            helper="عنوان المستند، المرجع، والتاريخ — يظهر في رأس العرض"
          >
            <div className="ws-field-group">
              <div>
                <label className="ws-field-label">Document Title — عنوان المستند</label>
                <input
                  value={quote.documentTitle}
                  onChange={(e) => updateField("documentTitle", e.target.value)}
                  placeholder="عرض سعر تصنيع قالب بلوك 20"
                  className="input-field text-sm w-full border-accent/20 focus:border-accent"
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="ws-field-label">Reference Number</label>
                  <input
                    value={quote.referenceNumber}
                    onChange={(e) => updateField("referenceNumber", e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="ws-field-label">Date</label>
                  <input
                    value={quote.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            sectionKey="greeting"
            visible={sectionVisibility.greeting}
            onToggleVisibility={toggleSectionVisibility}
            helper="مقدمة التحية واسم العميل — تظهر بعد رأس المستند"
          >
            <div className="ws-field-group">
              <div>
                <label className="ws-field-label">Client Name (السادة)</label>
                <input
                  value={quote.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  className="input-field text-sm w-full"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="ws-field-label">Opening Greeting</label>
                <textarea
                  value={quote.greeting}
                  onChange={(e) => updateField("greeting", e.target.value)}
                  rows={4}
                  className="input-field text-sm w-full resize-none"
                  dir="rtl"
                />
              </div>
            </div>
          </WorkspaceSection>

          {!isVisualOffer && (
          <WorkspaceSection
            sectionKey="technicalSpecs"
            visible={sectionVisibility.technicalSpecs}
            onToggleVisibility={toggleSectionVisibility}
            helper="جدول المواصفات الفنية — أضف أو احذف الصفوف دون فقدان البيانات"
          >
            <div className="ws-field-group">
              <div>
                <label className="ws-field-label">Section Title</label>
                <input
                  value={quote.technicalSectionTitle}
                  onChange={(e) => updateField("technicalSectionTitle", e.target.value)}
                  className="input-field text-sm w-full"
                  dir="rtl"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-ink uppercase tracking-wide">Editable Column Headers</p>
            <ColumnHeaderInputs
              columns={quote.technicalColumns}
              keys={["serial", "parameter", "value"]}
              labels={["Serial (م)", "Parameter", "Value / Description"]}
              onChange={updateTechColumn}
            />
            <div className="overflow-x-auto custom-scroll rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full">
              <table className="elite-table text-sm min-w-full w-full">
                <thead>
                  <tr>
                    <th className="w-12">{quote.technicalColumns.serial}</th>
                    <th>{quote.technicalColumns.parameter}</th>
                    <th>{quote.technicalColumns.value}</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {quote.technicalSpecs.map((row, idx) => (
                    <tr key={row.id} className="offer-row-active">
                      <td>
                        <input
                          value={row.serial}
                          onChange={(e) => updateSpec(row.id, "serial", e.target.value)}
                          className="input-field py-1.5 text-xs text-center w-full"
                        />
                      </td>
                      <td>
                        <input
                          value={row.parameter}
                          onChange={(e) => updateSpec(row.id, "parameter", e.target.value)}
                          className="input-field py-1.5 text-xs w-full"
                          dir="rtl"
                        />
                      </td>
                      <td>
                        <input
                          value={row.value}
                          onChange={(e) => updateSpec(row.id, "value", e.target.value)}
                          className="input-field py-1.5 text-xs w-full"
                          dir="rtl"
                        />
                      </td>
                      <td className="flex flex-wrap gap-0.5">
                        <button
                          type="button"
                          title="Insert row below"
                          onClick={() => addSpec(idx)}
                          className="row-action-btn"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete row"
                          onClick={() => removeSpec(row.id)}
                          disabled={quote.technicalSpecs.length <= 1}
                          className="row-action-btn row-action-btn--danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => addSpec()} className="add-row-btn">
              <Plus size={16} /> Add Row
            </button>
          </WorkspaceSection>
          )}

          <WorkspaceSection
            sectionKey="commercialTerms"
            visible={sectionVisibility.commercialTerms}
            onToggleVisibility={toggleSectionVisibility}
            helper="العرض المالي وشروط التعاقد"
          >
            <div className="ws-field-group">
              <div>
                <label className="ws-field-label">Section Title</label>
                <input
                  value={quote.commercialSectionTitle}
                  onChange={(e) => updateField("commercialSectionTitle", e.target.value)}
                  className="input-field text-sm w-full"
                  dir="rtl"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-ink uppercase tracking-wide">Editable Column Headers</p>
            <ColumnHeaderInputs
              columns={quote.commercialColumns}
              keys={["serial", "termKey", "termValue"]}
              labels={["Serial (م)", "Term Key (البند)", "Term Value (الوصف)"]}
              onChange={updateCommColumn}
            />
            <div className="overflow-x-auto custom-scroll rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full">
              <table className="elite-table text-sm min-w-full w-full">
                <thead>
                  <tr>
                    <th className="w-12">{quote.commercialColumns.serial}</th>
                    <th>{quote.commercialColumns.termKey}</th>
                    <th>{quote.commercialColumns.termValue}</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {quote.commercialTerms.map((row, idx) => (
                    <tr key={row.id} className="offer-row-active">
                      <td>
                        <input
                          value={row.serial}
                          onChange={(e) => updateTerm(row.id, "serial", e.target.value)}
                          className="input-field py-1.5 text-xs text-center w-full"
                        />
                      </td>
                      <td>
                        <input
                          value={row.termKey}
                          onChange={(e) => updateTerm(row.id, "termKey", e.target.value)}
                          className="input-field py-1.5 text-xs w-full"
                          dir="rtl"
                        />
                      </td>
                      <td>
                        <input
                          value={row.termValue}
                          onChange={(e) => updateTerm(row.id, "termValue", e.target.value)}
                          className="input-field py-1.5 text-xs w-full"
                          dir="rtl"
                        />
                      </td>
                      <td className="flex flex-wrap gap-0.5">
                        <button
                          type="button"
                          title="Insert row below"
                          onClick={() => addTerm(idx)}
                          className="row-action-btn"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete row"
                          onClick={() => removeTerm(row.id)}
                          disabled={quote.commercialTerms.length <= 1}
                          className="row-action-btn row-action-btn--danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => addTerm()} className="add-row-btn">
              <Plus size={16} /> Add Row
            </button>
          </WorkspaceSection>

          <WorkspaceSection
            sectionKey="closingNote"
            visible={sectionVisibility.closingNote}
            onToggleVisibility={toggleSectionVisibility}
            helper="ملاحظة ختامية قبل التوقيعات"
          >
            <textarea
              value={quote.closingNote}
              onChange={(e) => updateField("closingNote", e.target.value)}
              rows={3}
              className="input-field text-sm w-full resize-none"
              dir="rtl"
            />
          </WorkspaceSection>

          <WorkspaceSection
            sectionKey="signatures"
            visible={sectionVisibility.signatures}
            onToggleVisibility={toggleSectionVisibility}
            helper="التوقيعات — ثلاثة أعمدة ثابتة: مسؤول البيع · التنفيذ والإشراف · المدير العام"
          >
            <SignatureDeskPreview
              salespersonId={quote.salespersonId}
              salespersonRoster={salespersonRoster}
              onSalespersonChange={handleSalespersonChange}
            />
          </WorkspaceSection>

          <WorkspaceSection
            sectionKey="companyFooter"
            visible={sectionVisibility.companyFooter}
            onToggleVisibility={toggleSectionVisibility}
            helper="بيانات الاتصال الرسمية — تذييل كل صفحة"
          >
            <div className="ws-field-group space-y-3">
              <div>
                <label className="ws-field-label">Company Name Line</label>
                <input
                  value={quote.companyFooter.companyName}
                  onChange={(e) => updateFooter("companyName", e.target.value)}
                  className="input-field text-sm w-full"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="ws-field-label">Headquarters — Arabic</label>
                  <input
                    value={quote.companyFooter.headquartersAr}
                    onChange={(e) => updateFooter("headquartersAr", e.target.value)}
                    className="input-field text-sm w-full"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="ws-field-label">Headquarters — English</label>
                  <input
                    value={quote.companyFooter.headquartersEn}
                    onChange={(e) => updateFooter("headquartersEn", e.target.value)}
                    className="input-field text-sm w-full"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="ws-field-label">Factory — Arabic</label>
                  <input
                    value={quote.companyFooter.factoryAr}
                    onChange={(e) => updateFooter("factoryAr", e.target.value)}
                    className="input-field text-sm w-full"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="ws-field-label">Factory — English</label>
                  <input
                    value={quote.companyFooter.factoryEn}
                    onChange={(e) => updateFooter("factoryEn", e.target.value)}
                    className="input-field text-sm w-full"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="ws-field-label">Website URL</label>
                  <input
                    value={quote.companyFooter.website}
                    onChange={(e) => updateFooter("website", e.target.value)}
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="ws-field-label">Primary Phone Number</label>
                  <input
                    value={quote.companyFooter.phone}
                    onChange={(e) => updateFooter("phone", e.target.value)}
                    className="input-field text-sm w-full"
                    dir="ltr"
                    placeholder="+201228004646"
                  />
                </div>
              </div>
            </div>
            <div className="ws-field-group space-y-2">
              <p className="text-[10px] font-bold text-ink uppercase tracking-wide">Additional Footer Lines</p>
              {(quote.companyFooter.extraLines || []).map((line, i) => (
                <div key={i} className="flex flex-wrap gap-2 w-full">
                  <input
                    value={line}
                    onChange={(e) => updateFooterLine(i, e.target.value)}
                    className="input-field text-sm flex-1 min-w-0 w-full"
                    dir="rtl"
                    placeholder="Optional extra contact line…"
                  />
                  <button
                    type="button"
                    onClick={() => removeFooterLine(i)}
                    className="row-action-btn row-action-btn--danger shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addFooterLine} className="add-row-btn">
                <Plus size={16} /> Add Footer Line
              </button>
            </div>
          </WorkspaceSection>

          {isVisualOffer ? (
            <WorkspaceSection
              sectionKey="machineryItems"
              visible={sectionVisibility.machineryItems}
              onToggleVisibility={toggleSectionVisibility}
              helper="أقسام الماكينات — صورة + جدول مواصفات + بطاقة سعر (Heavy Machinery layout)"
            >
              <MachineryItemsPanel
                items={quote.machineryItems || []}
                onChange={(items) => updateField("machineryItems", items)}
              />
            </WorkspaceSection>
          ) : (
            <WorkspaceSection
              sectionKey="visualAttachments"
              visible={sectionVisibility.visualAttachments}
              onToggleVisibility={toggleSectionVisibility}
              helper="إرفاق صور اختياري — يظهر في المعاينة والطباعة عند الإضافة فقط"
            >
              <VisualAttachmentsPanel attachments={visualAttachments} onChange={setVisualAttachments} />
            </WorkspaceSection>
          )}
        </div>
      </div>

      <TemplatePickerDrawer
        open={showTemplateDrawer}
        adminKey={adminKey}
        onClose={() => setShowTemplateDrawer(false)}
        onSelect={handleLoadFromTemplate}
      />

      {blueprintModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => !blueprintSaving && setBlueprintModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl p-6 space-y-4 animate-[fadeInUp_0.25s_ease-out]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#3b767c]">Blueprint Template</p>
                <h3 className="text-xl font-black text-neutral-950 mt-1" dir="rtl">
                  حفظ كقالب جاهز
                </h3>
                <p className="text-sm font-semibold text-neutral-800 mt-1">
                  Saves the exact live quote schema — rows, tables, terms, and layout settings.
                </p>
              </div>
              <LayoutTemplate size={28} className="text-[#3b767c] shrink-0" strokeWidth={2} />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-950 mb-1 uppercase">Name (English)</label>
                <input
                  className="input-field font-semibold text-neutral-950"
                  value={blueprintForm.name}
                  onChange={(e) => setBlueprintForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-950 mb-1 uppercase">Name (Arabic)</label>
                <input
                  className="input-field font-semibold text-neutral-950"
                  dir="rtl"
                  value={blueprintForm.nameAr}
                  onChange={(e) => setBlueprintForm((f) => ({ ...f, nameAr: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-950 mb-1 uppercase">Description</label>
                <textarea
                  className="input-field font-semibold text-neutral-950 resize-none"
                  rows={2}
                  value={blueprintForm.description}
                  onChange={(e) => setBlueprintForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={blueprintForm.keepClientName}
                  onChange={(e) => setBlueprintForm((f) => ({ ...f, keepClientName: e.target.checked }))}
                  className="rounded border-neutral-400 text-[#3b767c] focus:ring-[#3b767c]"
                />
                <span className="text-sm font-semibold text-neutral-900">
                  Keep client name as boilerplate / الاحتفاظ باسم العميل كنموذج
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={blueprintSaving}
                className="quote-blueprint-save-btn flex-1 min-w-[200px] justify-center py-3"
              >
                {blueprintSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {blueprintSaving ? "جاري الحفظ…" : "Save Blueprint"}
              </button>
              <button
                type="button"
                disabled={blueprintSaving}
                onClick={() => setBlueprintModalOpen(false)}
                className="btn-outline py-3 px-5 font-bold text-neutral-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
