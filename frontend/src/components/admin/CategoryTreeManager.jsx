import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X, FolderTree } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/client.js";
import {
  EMPTY_CATEGORY,
  ROOT_PARENT_VALUE,
  validateBilingualCategory,
} from "../../constants/catalogSchema.js";
import { buildNestedTreeRows, flattenWithPaths } from "../../utils/categoryTree.js";
import BilingualFieldWorkspace from "./BilingualFieldWorkspace.jsx";
import "../../styles/catalogAdmin.css";
import "../../styles/quoteWorkspace.css";

export default function CategoryTreeManager({ categories, adminKey, onRefresh }) {
  const [form, setForm] = useState(null);
  const [langTab, setLangTab] = useState("ar");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");

  const treeRows = buildNestedTreeRows(categories);
  const parentOptions = flattenWithPaths(
    form?.id ? categories.filter((c) => c.id !== form.id) : categories,
    "ar"
  );

  const openAdd = () => {
    setForm({ ...EMPTY_CATEGORY });
    setValidationError("");
    setLangTab("ar");
  };

  const openEdit = (cat) => {
    setForm({
      ...cat,
      parentId: cat.parentId ?? null,
    });
    setValidationError("");
    setLangTab("ar");
  };

  const closeForm = () => {
    setForm(null);
    setValidationError("");
  };

  const handleSave = async () => {
    const missing = validateBilingualCategory(form);
    if (missing.length) {
      setValidationError(
        `Please complete all bilingual fields before saving: ${missing.join(", ")}.`
      );
      return;
    }

    setSaving(true);
    setValidationError("");
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        parentId: form.parentId === ROOT_PARENT_VALUE || form.parentId === "" ? null : form.parentId,
      };

      if (form.id) await updateCategory(form.id, payload, adminKey);
      else await createCategory(payload, adminKey);

      closeForm();
      onRefresh?.();
    } catch (e) {
      setValidationError(e.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? Sub-categories and assigned products must be cleared first.")) return;
    try {
      await deleteCategory(id, adminKey);
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="catalog-panel-title">
            <FolderTree size={16} /> إدارة شجرة التصنيفات — Category Tree Manager
          </h3>
          <p className="text-xs text-ink-muted mt-1">
            Nested bilingual categories with unlimited sub-levels via parentId.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary text-sm py-2">
          <Plus size={16} /> إضافة تصنيف جديد / Add Category
        </button>
      </div>

      {form && (
        <div className="catalog-panel border-accent/20">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-ink">
              {form.id ? "Edit Category" : "New Category Panel"}
            </h4>
            <button type="button" onClick={closeForm} className="row-action-btn">
              <X size={16} />
            </button>
          </div>

          {validationError && (
            <div className="catalog-validation-banner" role="alert">
              {validationError}
            </div>
          )}

          <BilingualFieldWorkspace
            langTab={langTab}
            onLangTabChange={setLangTab}
            enContent={
              <>
                <div>
                  <label className="catalog-field-label catalog-field-label--required">English Name</label>
                  <input
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    className="catalog-field-input"
                    dir="ltr"
                    placeholder="Category title in English"
                  />
                </div>
              </>
            }
            arContent={
              <>
                <div>
                  <label className="catalog-field-label catalog-field-label--required">الاسم بالعربية</label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    className="catalog-field-input"
                    dir="rtl"
                    placeholder="عنوان التصنيف بالعربية"
                  />
                </div>
              </>
            }
          />

          <div>
            <label className="catalog-field-label">التصنيف الأب / Parent Category</label>
            <select
              value={form.parentId ?? ROOT_PARENT_VALUE}
              onChange={(e) =>
                setForm({
                  ...form,
                  parentId: e.target.value === ROOT_PARENT_VALUE ? null : Number(e.target.value),
                })
              }
              className="catalog-select"
            >
              <option value={ROOT_PARENT_VALUE}>
                تصنيف رئيسي مباشر (بدون أب) / Direct Root Category
              </option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.pathAr} / {opt.pathEn}
                </option>
              ))}
            </select>
          </div>

          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Category
          </button>
        </div>
      )}

      <div className="catalog-panel">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-3">
          Hierarchy ({categories.length} categories)
        </p>
        {treeRows.length === 0 ? (
          <p className="text-sm text-ink-muted py-6 text-center">
            No categories yet. Add a root category to begin.
          </p>
        ) : (
          <div className="space-y-1">
            {treeRows.map((cat) => (
              <div key={cat.id} className="catalog-tree-row">
                <span className="catalog-tree-indent" style={{ width: `${cat.depth * 1.25}rem` }} />
                <span className="catalog-tree-badge">L{cat.depth + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink truncate" dir="rtl">
                    {cat.nameAr}
                  </p>
                  <p className="text-xs text-ink-muted truncate" dir="ltr">
                    {cat.nameEn}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="row-action-btn"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    className="row-action-btn row-action-btn--danger"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
