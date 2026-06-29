import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Loader2, AlertCircle, X, Sparkles, Search } from "lucide-react";
import { getCatalog } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { buildNestedTreeRows, categoryLabel, flattenWithPaths } from "../utils/categoryTree.js";
import {
  countProductsInCategory,
  filterCatalogProducts,
  getRootCategories,
} from "../utils/catalogStorefrontUtils.js";
import CatalogProductCard from "../components/CatalogProductCard.jsx";
import CatalogCategoryTree from "../components/CatalogCategoryTree.jsx";
import CatalogFilterPanel from "../components/CatalogFilterPanel.jsx";
import ProductDetailView from "../components/ProductDetailView.jsx";
import RFQModal from "../components/RFQModal.jsx";
import SeoHead from "../components/SeoHead.jsx";
import { CatalogEmpty } from "../components/CatalogCard.jsx";
import { productDisplayName } from "../constants/catalogSchema.js";
import { catalogProductUrl } from "../constants/seo.js";
import { buildCatalogSchema, buildProductSchema } from "../utils/seoSchema.js";
import "../styles/catalogStorefront.css";

export default function CatalogPage() {
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [gridEpoch, setGridEpoch] = useState(0);
  const [gridVisible, setGridVisible] = useState(true);
  const [rfqItem, setRfqItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    getCatalog({ facet: "products", includeSubcategories: "true" })
      .then((r) => {
        setCategories(r.categories || []);
        setProducts(r.products || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const q = searchParams.get("search");
    if (q != null && q !== search) setSearch(q);

    const catId = searchParams.get("category");
    if (catId != null) {
      const parsed = Number(catId);
      if (!Number.isNaN(parsed) && parsed !== selectedCategoryId) {
        setSelectedCategoryId(parsed);
      }
    }

    const productId = searchParams.get("product");
    if (productId && products.length) {
      const found = products.find((p) => String(p.id) === String(productId));
      if (found) setSelectedProduct(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from URL after catalog load
  }, [loading, products, searchParams]);

  const syncParams = useCallback(
    (patch, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value == null || value === "") next.delete(key);
            else next.set(key, String(value));
          });
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const openProduct = useCallback(
    (item) => {
      setSelectedProduct(item);
      syncParams({ product: item.id });
    },
    [syncParams]
  );

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
    syncParams({ product: null }, true);
  }, [syncParams]);

  useEffect(() => {
    if (!mobileFiltersOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  const categoryPaths = useMemo(() => flattenWithPaths(categories, lang), [categories, lang]);
  const treeRows = useMemo(() => buildNestedTreeRows(categories), [categories]);
  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);

  const filteredProducts = useMemo(
    () =>
      filterCatalogProducts(products, categories, {
        search,
        categoryId: selectedCategoryId,
        subCategoryId,
      }),
    [products, categories, search, selectedCategoryId, subCategoryId]
  );

  const refreshGrid = useCallback(() => {
    setGridVisible(false);
    window.requestAnimationFrame(() => {
      setGridEpoch((n) => n + 1);
      setGridVisible(true);
    });
  }, []);

  const handleCategoryTab = (id) => {
    setSelectedCategoryId(id);
    setSubCategoryId(null);
    syncParams({ category: id, product: null }, true);
    setSelectedProduct(null);
    refreshGrid();
  };

  const handleCategorySelect = (id) => {
    setSelectedCategoryId(id);
    setSubCategoryId(null);
    refreshGrid();
  };

  const clearAllFilters = () => {
    setSearch("");
    setSubCategoryId(null);
    refreshGrid();
  };

  const resolvePath = (categoryId) =>
    categoryPaths.find((c) => Number(c.id) === Number(categoryId))?.path || "";

  const L = {
    en: {
      title: "Industrial Product Catalog",
      subtitle: "Premium engineering storefront — scan, browse, and request technical quotes instantly.",
      liveSearch: "Live Search",
      searchPlaceholder: "Search titles & specifications…",
      clearSearch: "Clear search",
      subCategory: "Sub-category",
      categoryDivision: "Division",
      allCategories: "All divisions",
      allInTab: "All in selected division",
      clearAll: "Reset filters",
      results: "products",
      all: "All Products",
      featured: "EGY MAC — Corporate Catalog",
      filterFab: "Filter Products",
      filtersTitle: "Advanced Filters",
      applyClose: "Show results",
      sidebarTitle: "Refine catalog",
      mobileSearchHint: "Instant search across titles & specs",
    },
    ar: {
      title: "فهرس المنتجات الصناعي",
      subtitle: "واجهة عرض احترافية — تصفح واطلب عروضاً فنية فوراً من جوالك أو سطح المكتب.",
      liveSearch: "بحث فوري",
      searchPlaceholder: "ابحث في العناوين والمواصفات…",
      clearSearch: "مسح البحث",
      subCategory: "تصنيف فرعي",
      categoryDivision: "التقسيم",
      allCategories: "كل التقسيمات",
      allInTab: "الكل ضمن التقسيم",
      clearAll: "إعادة ضبط الفلاتر",
      results: "منتج",
      all: "كل المنتجات",
      featured: "إيجي ماك — الكتالوج المؤسسي",
      filterFab: "تصفية المنتجات",
      filtersTitle: "فلاتر متقدمة",
      applyClose: "عرض النتائج",
      sidebarTitle: "تصفية الكتالوج",
      mobileSearchHint: "بحث فوري في العناوين والمواصفات",
    },
  }[lang];

  const filterProps = {
    lang,
    labels: L,
    search,
    onSearchChange: (v) => {
      setSearch(v);
      syncParams({ search: v.trim() || null }, true);
      refreshGrid();
    },
    onClearAll: clearAllFilters,
    categories,
    treeRows,
    rootCategories,
    selectedCategoryId,
    onCategoryChange: handleCategorySelect,
    subCategoryId,
    onSubCategoryChange: (id) => {
      setSubCategoryId(id);
      refreshGrid();
    },
  };

  const activeFilterCount = [search.trim(), subCategoryId != null].filter(Boolean).length;

  const catalogSeo = useMemo(() => {
    if (selectedProduct) {
      const title = productDisplayName(selectedProduct, lang);
      const description =
        lang === "ar"
          ? selectedProduct.descriptionAr || selectedProduct.descriptionEn
          : selectedProduct.descriptionEn || selectedProduct.descriptionAr;
      return {
        title: `${title} | Egy Mac Catalog`,
        description: description?.slice(0, 160) || L.subtitle,
        path: catalogProductUrl(selectedProduct.id),
        image: Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : "/logo.png",
        jsonLd: buildProductSchema(selectedProduct, lang),
      };
    }
    return {
      title: lang === "ar" ? "فهرس المنتجات | إيجي ماك" : "Industrial Product Catalog | Egy Mac",
      description: L.subtitle,
      path: "/catalog",
      jsonLd: buildCatalogSchema(),
    };
  }, [selectedProduct, lang, L.subtitle]);

  return (
    <div className="catalog-storefront min-h-screen bg-slate-50 pt-20">
      <SeoHead
        title={catalogSeo.title}
        description={catalogSeo.description}
        path={catalogSeo.path}
        image={catalogSeo.image}
        lang={lang}
        jsonLd={catalogSeo.jsonLd}
      />
      <header className="catalog-storefront-hero">
        <div className="section-container relative z-10 py-10 lg:py-12">
          <div className="flex items-center gap-2 text-[#3b767c] text-xs font-extrabold uppercase tracking-[0.16em] mb-3">
            <Sparkles size={14} />
            {L.featured}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black text-slate-900 tracking-tight leading-tight">
            {L.title}
          </h1>
          <p className="mt-3 text-base sm:text-lg font-semibold text-slate-800 max-w-2xl leading-relaxed">
            {L.subtitle}
          </p>

          {/* Mobile / tablet sticky live search dock (QR-optimized) */}
          <div className="catalog-search-dock lg:hidden mt-8">
            <div className="catalog-search-dock__input-wrap">
              <Search size={18} className="catalog-search-dock__icon" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => filterProps.onSearchChange(e.target.value)}
                placeholder={L.searchPlaceholder}
                className="catalog-search-dock__input"
                aria-label={L.liveSearch}
              />
              {search ? (
                <button
                  type="button"
                  className="catalog-search-dock__clear"
                  onClick={() => filterProps.onSearchChange("")}
                  aria-label={L.clearSearch}
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
            <p className="catalog-search-dock__hint">{L.mobileSearchHint}</p>
          </div>
        </div>
      </header>

      <div className="section-container pb-28 lg:pb-16">
        {selectedProduct ? (
          <ProductDetailView
            item={selectedProduct}
            onBack={closeProduct}
            onQuote={(it) => setRfqItem(it)}
          />
        ) : (
          <>
            <nav className="catalog-category-tabs" aria-label={L.categoryDivision}>
              <button
                type="button"
                onClick={() => handleCategoryTab(null)}
                className={`catalog-category-tab ${selectedCategoryId == null ? "catalog-category-tab--active" : ""}`}
              >
                {L.all}
                <span className="catalog-category-tab__count">{products.length}</span>
              </button>
              {rootCategories.map((cat) => {
                const count = countProductsInCategory(products, categories, cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryTab(cat.id)}
                    className={`catalog-category-tab ${selectedCategoryId === cat.id ? "catalog-category-tab--active" : ""}`}
                  >
                    {categoryLabel(cat, lang)}
                    <span className="catalog-category-tab__count">{count}</span>
                  </button>
                );
              })}
            </nav>

            <div className="catalog-layout">
              <aside className="catalog-sidebar hidden lg:block">
                <div className="catalog-sidebar__inner catalog-sidebar__inner--stack">
                  <h2 className="catalog-sidebar__title">{L.categoryDivision}</h2>
                  <CatalogCategoryTree
                    lang={lang}
                    categories={categories}
                    products={products}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={handleCategoryTab}
                    allLabel={L.all}
                    allCount={products.length}
                  />
                  <hr className="catalog-sidebar__divider" />
                  <h2 className="catalog-sidebar__title">{L.sidebarTitle}</h2>
                  <CatalogFilterPanel {...filterProps} />
                </div>
              </aside>

              <main className="catalog-main">
                <div className="catalog-results-bar">
                  <p className="catalog-results-count">
                    <strong>{filteredProducts.length}</strong> {L.results}
                  </p>
                  {selectedCategoryId != null && (
                    <button
                      type="button"
                      className="catalog-results-clear-tab"
                      onClick={() => handleCategoryTab(null)}
                    >
                      <X size={14} />
                      {L.all}
                    </button>
                  )}
                </div>

                {loading && (
                  <div className="catalog-grid-stage catalog-grid-stage--loading">
                    <Loader2 size={36} className="animate-spin text-[#3b767c]" />
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-600 py-16 font-bold">
                    <AlertCircle size={20} /> {error}
                  </div>
                )}

                {!loading && !error && (
                  <div
                    key={gridEpoch}
                    className={`catalog-grid-stage ${gridVisible ? "catalog-grid-stage--visible" : ""}`}
                  >
                    <div className="catalog-product-grid">
                      {filteredProducts.map((item, i) => (
                        <div
                          key={item.id}
                          className="catalog-product-grid__item"
                          style={{ animationDelay: `${Math.min(i * 40, 360)}ms` }}
                        >
                          <CatalogProductCard
                            product={item}
                            categoryPath={resolvePath(item.categoryId)}
                            onQuote={setRfqItem}
                            onSelect={openProduct}
                          />
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="catalog-product-grid__empty">
                          <CatalogEmpty lang={lang} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </main>
            </div>
          </>
        )}
      </div>

      {!selectedProduct && (
        <button
          type="button"
          className="catalog-filter-fab lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
          aria-expanded={mobileFiltersOpen}
        >
          <SlidersHorizontal size={20} />
          <span>{L.filterFab}</span>
          {activeFilterCount > 0 ? (
            <span className="catalog-filter-fab__badge">{activeFilterCount}</span>
          ) : null}
        </button>
      )}

      <div
        className={`catalog-mobile-drawer ${mobileFiltersOpen ? "catalog-mobile-drawer--open" : ""}`}
        aria-hidden={!mobileFiltersOpen}
      >
        <button
          type="button"
          className="catalog-mobile-drawer__backdrop"
          aria-label="Close filters"
          onClick={() => setMobileFiltersOpen(false)}
        />
        <div className="catalog-mobile-drawer__sheet" role="dialog" aria-modal="true">
          <div className="catalog-mobile-drawer__handle" aria-hidden />
          <div className="catalog-mobile-drawer__header">
            <h2 className="catalog-mobile-drawer__title">{L.filtersTitle}</h2>
            <button
              type="button"
              className="catalog-mobile-drawer__close"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
          <div className="catalog-mobile-drawer__body">
            <CatalogFilterPanel {...filterProps} compact hideSearch />
          </div>
          <div className="catalog-mobile-drawer__footer">
            <button
              type="button"
              className="catalog-mobile-drawer__apply"
              onClick={() => setMobileFiltersOpen(false)}
            >
              {L.applyClose} ({filteredProducts.length})
            </button>
          </div>
        </div>
      </div>

      {rfqItem && <RFQModal product={rfqItem} onClose={() => setRfqItem(null)} />}
    </div>
  );
}
