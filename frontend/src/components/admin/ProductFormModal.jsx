import { useRef, useState } from "react";
import { X, Save, Loader2, Upload, ImagePlus, AlertCircle } from "lucide-react";
import {
  EMPTY_PRODUCT,
  validateBilingualProduct,
  MAX_CATALOG_IMAGES,
} from "../../constants/catalogSchema.js";
import { flattenWithPaths } from "../../utils/categoryTree.js";
import { readImageFilesAsBase64 } from "../../utils/catalogImageUpload.js";
import BilingualFieldWorkspace from "./BilingualFieldWorkspace.jsx";
import "../../styles/catalogAdmin.css";
import "../../styles/quoteWorkspace.css";

export default function ProductFormModal({
  initialProduct = null,
  categories = [],
  saving = false,
  onSave,
  onClose,
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState(initialProduct ? { ...initialProduct, images: [...(initialProduct.images || [])] } : { ...EMPTY_PRODUCT });
  const [langTab, setLangTab] = useState("ar");
  const [validationError, setValidationError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const categoryOptions = flattenWithPaths(categories, "ar");
  const isEdit = Boolean(form.id);

  const patch = (fields) => setForm((prev) => ({ ...prev, ...fields }));

  const handleFiles = async (e) => {
    setUploadError("");
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length) return;

    setUploading(true);
    try {
      const { images: newImages, errors } = await readImageFilesAsBase64(files, {
        existingCount: form.images.length,
      });
      if (errors.length) setUploadError(errors.join(" "));
      if (newImages.length) {
        patch({ images: [...form.images, ...newImages].slice(0, MAX_CATALOG_IMAGES) });
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    patch({ images: form.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = () => {
    const missing = validateBilingualProduct(form);
    if (missing.length) {
      setValidationError(
        `Please complete all required bilingual fields before saving: ${missing.join(", ")}.`
      );
      return;
    }
    setValidationError("");
    onSave?.({
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim(),
      descriptionEn: form.descriptionEn.trim(),
      categoryId: Number(form.categoryId),
      images: form.images,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-overlay backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-surface border border-border/70 rounded-2xl shadow-soft-lg max-h-[92vh] overflow-y-auto custom-scroll catalog-bilingual-workspace">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border/70 sticky top-0 bg-surface/95 backdrop-blur-sm rounded-t-2xl z-10">
          <h3 className="font-bold text-ink">
            {isEdit ? "Edit Product — تعديل المنتج" : "Add Product — إضافة منتج"}
          </h3>
          <button type="button" onClick={onClose} className="row-action-btn">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {(validationError || uploadError) && (
            <div className="catalog-validation-banner flex items-start gap-2" role="alert">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{validationError || uploadError}</span>
            </div>
          )}

          <BilingualFieldWorkspace
            langTab={langTab}
            onLangTabChange={setLangTab}
            enContent={
              <>
                <div>
                  <label className="catalog-field-label catalog-field-label--required">Product Name</label>
                  <input
                    value={form.nameEn}
                    onChange={(e) => patch({ nameEn: e.target.value })}
                    className="catalog-field-input"
                    dir="ltr"
                    placeholder="English product title"
                  />
                </div>
                <div>
                  <label className="catalog-field-label catalog-field-label--required">Description / Specifications</label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={(e) => patch({ descriptionEn: e.target.value })}
                    rows={5}
                    className="catalog-field-input resize-none"
                    dir="ltr"
                    placeholder="Detailed English specifications"
                  />
                </div>
              </>
            }
            arContent={
              <>
                <div>
                  <label className="catalog-field-label catalog-field-label--required">اسم المنتج</label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => patch({ nameAr: e.target.value })}
                    className="catalog-field-input"
                    dir="rtl"
                    placeholder="عنوان المنتج بالعربية"
                  />
                </div>
                <div>
                  <label className="catalog-field-label catalog-field-label--required">الوصف / المواصفات</label>
                  <textarea
                    value={form.descriptionAr}
                    onChange={(e) => patch({ descriptionAr: e.target.value })}
                    rows={5}
                    className="catalog-field-input resize-none"
                    dir="rtl"
                    placeholder="المواصفات التفصيلية بالعربية"
                  />
                </div>
              </>
            }
          />

          <div>
            <label className="catalog-field-label catalog-field-label--required">
              التصنيف / Category Assignment
            </label>
            <select
              value={form.categoryId ?? ""}
              onChange={(e) => patch({ categoryId: e.target.value ? Number(e.target.value) : null })}
              className="catalog-select"
            >
              <option value="" disabled>
                — Select nested category / اختر التصنيف —
              </option>
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {"\u00A0".repeat(opt.depth * 2)}
                  {opt.pathAr} / {opt.pathEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="catalog-field-label">Product Images — صور المنتج (Local Upload)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || form.images.length >= MAX_CATALOG_IMAGES}
              className="catalog-upload-zone w-full"
            >
              {uploading ? (
                <Loader2 size={28} className="mx-auto animate-spin text-accent" />
              ) : (
                <>
                  <Upload size={28} className="mx-auto text-accent mb-2" />
                  <p className="text-sm font-bold text-accent">
                    اضغط لرفع صور من الجهاز / Click to upload images
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    PNG, JPG, WebP — max 4 MB each — up to {MAX_CATALOG_IMAGES} images
                  </p>
                </>
              )}
            </button>

            {form.images.length > 0 && (
              <div className="catalog-image-grid">
                {form.images.map((src, index) => (
                  <figure key={`${index}-${src.slice(0, 24)}`} className="catalog-image-thumb">
                    <img src={src} alt={`Product ${index + 1}`} />
                    <div className="catalog-image-delete">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="catalog-image-delete-btn"
                      >
                        إزالة / Delete
                      </button>
                    </div>
                  </figure>
                ))}
              </div>
            )}

            {form.images.length === 0 && (
              <p className="text-xs text-ink-muted flex items-center gap-1.5 mt-2">
                <ImagePlus size={14} /> No images selected yet.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 sticky bottom-0 bg-surface/95 backdrop-blur-sm pt-2">
          <button type="button" onClick={handleSubmit} disabled={saving || uploading} className="btn-primary w-full sm:w-auto">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
}
