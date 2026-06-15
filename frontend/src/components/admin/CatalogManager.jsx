import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Package, FolderTree } from "lucide-react";
import {
  getCategories,
  getCatalogProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../api/client.js";
import { EMPTY_PRODUCT, productPrimaryImage } from "../../constants/catalogSchema.js";
import { findCategoryById, flattenWithPaths } from "../../utils/categoryTree.js";
import CategoryTreeManager from "./CategoryTreeManager.jsx";
import ProductFormModal from "./ProductFormModal.jsx";
import { TableSkeleton } from "./Skeleton.jsx";
import "../../styles/catalogAdmin.css";
import "../../styles/quoteWorkspace.css";

export default function CatalogManager({ adminKey }) {
  const [adminTab, setAdminTab] = useState("products");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productModal, setProductModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, prodRes] = await Promise.all([
        getCategories(adminKey),
        getCatalogProducts({}, adminKey),
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (e) {
      setError(e.message || "Failed to load catalog.");
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryPaths = flattenWithPaths(categories, "en");

  const resolveCategoryPath = (categoryId) => {
    const row = categoryPaths.find((c) => Number(c.id) === Number(categoryId));
    return row?.path || "—";
  };

  const openAddProduct = () => {
    setProductModal({ mode: "add", product: { ...EMPTY_PRODUCT } });
  };

  const openEditProduct = (product) => {
    setProductModal({ mode: "edit", product: { ...product, images: [...(product.images || [])] } });
  };

  const handleSaveProduct = async (payload) => {
    setSaving(true);
    try {
      if (productModal.mode === "add") {
        await createProduct(payload, adminKey);
      } else {
        await updateProduct(productModal.product.id, payload, adminKey);
      }
      setProductModal(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Delete this product from the catalog?")) return;
    try {
      await deleteProduct(id, adminKey);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="segmented-control flex-wrap mb-2">
          <div className="h-9 w-36 rounded-lg bg-accent-light/50 animate-pulse" />
          <div className="h-9 w-44 rounded-lg bg-accent-light/50 animate-pulse" />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm" role="alert">
        {error}
        <button type="button" onClick={load} className="block mt-2 text-accent font-semibold hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="catalog-bilingual-workspace space-y-6">
      <div className="segmented-control flex-wrap">
        <button
          type="button"
          onClick={() => setAdminTab("products")}
          className={`segmented-option flex items-center gap-2 ${adminTab === "products" ? "segmented-option-active" : ""}`}
        >
          <Package size={16} /> Products — المنتجات
        </button>
        <button
          type="button"
          onClick={() => setAdminTab("categories")}
          className={`segmented-option flex items-center gap-2 ${adminTab === "categories" ? "segmented-option-active" : ""}`}
        >
          <FolderTree size={16} /> Categories — التصنيفات
        </button>
      </div>

      {adminTab === "categories" ? (
        <CategoryTreeManager categories={categories} adminKey={adminKey} onRefresh={load} />
      ) : (
        <>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="catalog-panel-title">Product Catalog — فهرس المنتجات</h3>
              <p className="text-xs text-ink-muted mt-1">{products.length} bilingual products</p>
            </div>
            <button
              type="button"
              onClick={openAddProduct}
              disabled={categories.length === 0}
              className="btn-primary text-sm py-2"
              title={categories.length === 0 ? "Create at least one category first" : undefined}
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {categories.length === 0 && (
            <div className="catalog-validation-banner">
              Create categories in the Categories tab before adding products.
            </div>
          )}

          <div className="overflow-x-auto custom-scroll rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <table className="elite-table text-sm min-w-full w-full">
              <thead>
                <tr className="text-left">
                  <th className="w-16">Image</th>
                  <th>Name (EN / AR)</th>
                  <th>Category</th>
                  <th>Images</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const thumb = productPrimaryImage(item);
                  const cat = findCategoryById(categories, item.categoryId);
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <span className="w-12 h-12 rounded-lg bg-slate-100 inline-block" />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-ink" dir="ltr">
                          {item.nameEn || "—"}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5" dir="rtl">
                          {item.nameAr || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-body max-w-[200px]">
                        <span className="line-clamp-2">{resolveCategoryPath(item.categoryId)}</span>
                        {cat && (
                          <span className="catalog-tree-badge mt-1 inline-flex">
                            ID {cat.id}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold text-accent">
                        {item.images?.length || 0}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEditProduct(item)}
                            className="row-action-btn"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(item.id)}
                            className="row-action-btn row-action-btn--danger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-10">No products yet.</p>
            )}
          </div>
        </>
      )}

      {productModal && (
        <ProductFormModal
          initialProduct={productModal.product}
          categories={categories}
          saving={saving}
          onSave={handleSaveProduct}
          onClose={() => setProductModal(null)}
        />
      )}
    </div>
  );
}
