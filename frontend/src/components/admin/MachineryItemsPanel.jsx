import { useRef, useState } from "react";
import { Plus, Trash2, Upload, ImagePlus, X } from "lucide-react";
import {
  createMachineryItem,
  createMachinerySpecRow,
  machineryOrdinal,
} from "../../constants/machineryQuote.js";
import { nextUniqueId } from "../../utils/uniqueId.js";
import { sanitizePriceInput } from "../../utils/numericFieldGuard.js";
import { VISUAL_GALLERY_ITEMS, fileToDataUri } from "../../constants/visualOfferGallery.js";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Heavy Machinery editor panel (no-print) — manages quote.machineryItems.
 * Purely additive: standard/replica data paths are untouched.
 */
export default function MachineryItemsPanel({ items, onChange }) {
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [galleryTarget, setGalleryTarget] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const safeItems = Array.isArray(items) ? items : [];

  const patchItem = (id, patch) =>
    onChange(safeItems.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () => onChange([...safeItems, createMachineryItem(nextUniqueId())]);

  const removeItem = (id) => {
    if (safeItems.length <= 1) return;
    onChange(safeItems.filter((it) => it.id !== id));
  };

  const addSpec = (itemId) => {
    const item = safeItems.find((it) => it.id === itemId);
    if (!item) return;
    patchItem(itemId, {
      specs: [...(item.specs || []), createMachinerySpecRow(nextUniqueId())],
    });
  };

  const removeSpec = (itemId, specId) => {
    const item = safeItems.find((it) => it.id === itemId);
    if (!item || (item.specs || []).length <= 1) return;
    patchItem(itemId, { specs: item.specs.filter((s) => s.id !== specId) });
  };

  const updateSpec = (itemId, specId, field, value) => {
    const item = safeItems.find((it) => it.id === itemId);
    if (!item) return;
    patchItem(itemId, {
      specs: (item.specs || []).map((s) =>
        s.id === specId ? { ...s, [field]: value ?? "" } : s
      ),
    });
  };

  const pickFile = (itemId) => {
    setUploadTarget(itemId);
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    setUploadError("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploadTarget == null) return;
    if (!file.type.startsWith("image/")) {
      setUploadError(`"${file.name}" is not an image file.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(`"${file.name}" exceeds 4 MB.`);
      return;
    }
    try {
      const src = await fileToDataUri(file);
      patchItem(uploadTarget, { image: src, imageCaption: file.name.replace(/\.[^.]+$/, "") });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

      {safeItems.map((item, index) => (
        <div
          key={item.id}
          className="rounded-xl border border-border/70 bg-surface-muted/60 p-3.5 space-y-3 hover:border-accent/30 transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-accent text-secondary text-[11px] font-bold shrink-0 shadow-accent">
              {machineryOrdinal(index)}
            </span>
            <input
              value={item.title}
              onChange={(e) => patchItem(item.id, { title: e.target.value })}
              placeholder="خلاط عام — 1250 DCM3 DOUBLE SHAFT MIXER"
              className="input-field py-1.5 text-xs font-semibold flex-1"
              dir="auto"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              disabled={safeItems.length <= 1}
              title="Remove assembly"
              className="row-action-btn row-action-btn--danger shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Image uploader slot — locked high-res Base64 preview */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-ink-muted uppercase">
              صورة القسم — Section Image (Base64)
            </p>
            {item.image ? (
              <div className="relative rounded-xl border border-accent/30 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <img
                  src={item.image}
                  alt={item.imageCaption || "machinery"}
                  className="w-full h-32 object-contain pointer-events-none select-none"
                  draggable={false}
                />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-accent/90 text-white text-[9px] font-bold uppercase tracking-wide">
                  Locked Preview
                </span>
                <button
                  type="button"
                  onClick={() => patchItem(item.id, { image: null, imageCaption: "" })}
                  title="Remove image"
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => pickFile(item.id)}
                className="w-full h-24 rounded-xl border-2 border-dashed border-accent/40 flex flex-col items-center justify-center gap-1 text-accent/60 bg-white/40 hover:text-accent hover:border-accent hover:bg-accent-light/40 transition-all duration-200"
              >
                <ImagePlus size={20} />
                <span className="text-[10px] font-semibold">اضغط لرفع صورة من الجهاز</span>
              </button>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => pickFile(item.id)} className="btn-outline text-xs py-1.5 px-3">
                <Upload size={13} /> {item.image ? "Replace Image" : "Upload (Base64)"}
              </button>
              <button
                type="button"
                onClick={() => setGalleryTarget(galleryTarget === item.id ? null : item.id)}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Gallery
              </button>
            </div>
          </div>

          {galleryTarget === item.id && (
            <div className="grid grid-cols-4 gap-2">
              {VISUAL_GALLERY_ITEMS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  title={g.labelEn}
                  onClick={() => {
                    patchItem(item.id, { image: g.src, imageCaption: g.labelAr });
                    setGalleryTarget(null);
                  }}
                  className="border border-border hover:border-accent rounded-lg p-1 bg-white hover:-translate-y-0.5 hover:shadow-soft active:scale-95 transition-all duration-200"
                >
                  <img src={g.src} alt={g.labelEn} className="w-full h-10 object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Dynamic spec grid builder — rows bound strictly to this section */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-ink-muted uppercase">
              شبكة المواصفات الفنية — Specification Grid
            </p>
            {(item.specs || []).map((spec) => (
              <div key={spec.id} className="flex gap-1.5">
                <input
                  value={spec.label}
                  onChange={(e) => updateSpec(item.id, spec.id, "label", e.target.value)}
                  placeholder="المواصفة / البيان الفني"
                  className="input-field py-1 text-xs w-2/5"
                  dir="auto"
                />
                <input
                  value={spec.value}
                  onChange={(e) => updateSpec(item.id, spec.id, "value", e.target.value)}
                  placeholder="الوصف والمعيار"
                  className="input-field py-1 text-xs flex-1"
                  dir="auto"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(item.id, spec.id)}
                  disabled={(item.specs || []).length <= 1}
                  className="row-action-btn row-action-btn--danger shrink-0 self-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSpec(item.id)}
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover"
            >
              <Plus size={13} /> إضافة سطر مواصفة — Add Spec Row
            </button>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-ink-muted mb-0.5 uppercase">
                Item Price
              </label>
              <input
                value={item.price}
                onChange={(e) => patchItem(item.id, { price: sanitizePriceInput(e.target.value) })}
                placeholder="900,000"
                className="input-field py-1.5 text-xs font-bold transition-all duration-200"
                dir="ltr"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-ink-muted mb-0.5 uppercase">
                Price Note
              </label>
              <input
                value={item.priceNote}
                onChange={(e) => patchItem(item.id, { priceNote: e.target.value })}
                className="input-field py-1.5 text-xs"
                dir="rtl"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="add-row-btn flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover"
      >
        <Plus size={16} /> إضافة قسم ماكينة مصوّر — Add Machine Section
      </button>
    </div>
  );
}
