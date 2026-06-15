import { Search, X, Gauge, Package, Layers, Tag } from "lucide-react";
import { categoryLabel } from "../utils/categoryTree.js";
import { uniqueCapacityOptions } from "../utils/catalogStorefrontUtils.js";

export default function CatalogFilterPanel({
  lang,
  labels,
  search,
  onSearchChange,
  onClearAll,
  categories,
  treeRows,
  rootCategories,
  selectedCategoryId,
  onCategoryChange,
  subCategoryId,
  onSubCategoryChange,
  availability,
  onAvailabilityChange,
  capacityMin,
  capacityMax,
  onCapacityMinChange,
  onCapacityMaxChange,
  products,
  compact = false,
  hideSearch = false,
}) {
  const capacities = uniqueCapacityOptions(products);
  const hasActiveFilters =
    search.trim() ||
    subCategoryId != null ||
    availability !== "all" ||
    capacityMin ||
    capacityMax;

  const availabilityOptions = [
    { value: "all", label: labels.availabilityAll },
    { value: "standard", label: labels.availabilityStandard },
    { value: "custom", label: labels.availabilityCustom },
  ];

  return (
    <div className={`catalog-filter-panel ${compact ? "catalog-filter-panel--compact" : ""}`}>
      {!hideSearch ? (
        <div className="catalog-filter-panel__section">
          <label className="catalog-filter-panel__label">
            <Search size={14} />
            {labels.liveSearch}
          </label>
          <div className="catalog-filter-panel__search-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="catalog-filter-panel__search"
              aria-label={labels.liveSearch}
            />
            {search ? (
              <button
                type="button"
                className="catalog-filter-panel__search-clear"
                onClick={() => onSearchChange("")}
                aria-label={labels.clearSearch}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {rootCategories?.length > 0 && onCategoryChange ? (
        <div className="catalog-filter-panel__section">
          <label className="catalog-filter-panel__label">
            <Tag size={14} />
            {labels.categoryDivision}
          </label>
          <select
            className="catalog-filter-panel__select"
            value={selectedCategoryId ?? ""}
            onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{labels.allCategories}</option>
            {rootCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {categoryLabel(cat, lang)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="catalog-filter-panel__section">
        <label className="catalog-filter-panel__label">
          <Layers size={14} />
          {labels.subCategory}
        </label>
        <select
          className="catalog-filter-panel__select"
          value={subCategoryId ?? ""}
          onChange={(e) => onSubCategoryChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">{labels.allInTab}</option>
          {treeRows
            .filter((cat) => {
              if (selectedCategoryId == null) return true;
              const rootIds = new Set([selectedCategoryId]);
              const walk = (pid) => {
                for (const c of categories) {
                  if (Number(c.parentId) === Number(pid)) {
                    rootIds.add(c.id);
                    walk(c.id);
                  }
                }
              };
              walk(selectedCategoryId);
              return rootIds.has(cat.id);
            })
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {"—".repeat(cat.depth)} {categoryLabel(cat, lang)}
              </option>
            ))}
        </select>
      </div>

      <div className="catalog-filter-panel__section">
        <label className="catalog-filter-panel__label">
          <Package size={14} />
          {labels.availability}
        </label>
        <div className="catalog-filter-panel__pills" role="group" aria-label={labels.availability}>
          {availabilityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`catalog-filter-pill ${availability === opt.value ? "catalog-filter-pill--active" : ""}`}
              onClick={() => onAvailabilityChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {capacities.length > 0 ? (
        <div className="catalog-filter-panel__section">
          <label className="catalog-filter-panel__label">
            <Gauge size={14} />
            {labels.capacity}
          </label>
          <div className="catalog-filter-panel__range-grid">
            <select
              className="catalog-filter-panel__select"
              value={capacityMin}
              onChange={(e) => onCapacityMinChange(e.target.value)}
            >
              <option value="">{labels.minCapacity}</option>
              {capacities.map((c) => (
                <option key={`min-${c}`} value={c}>
                  {c} m³/day
                </option>
              ))}
            </select>
            <select
              className="catalog-filter-panel__select"
              value={capacityMax}
              onChange={(e) => onCapacityMaxChange(e.target.value)}
            >
              <option value="">{labels.maxCapacity}</option>
              {capacities.map((c) => (
                <option key={`max-${c}`} value={c}>
                  {c} m³/day
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {hasActiveFilters ? (
        <button type="button" onClick={onClearAll} className="catalog-filter-panel__reset">
          <X size={14} />
          {labels.clearAll}
        </button>
      ) : null}
    </div>
  );
}
