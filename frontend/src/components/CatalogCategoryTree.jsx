import { useState, useMemo } from "react";
import { ChevronDown, ChevronLeft, FolderOpen, Folder } from "lucide-react";
import { buildChildrenMap, categoryLabel } from "../utils/categoryTree.js";
import { countProductsInCategory } from "../utils/catalogStorefrontUtils.js";

function CategoryNode({
  cat,
  depth,
  lang,
  products,
  categories,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
}) {
  const childrenMap = useMemo(() => buildChildrenMap(categories), [categories]);
  const children = childrenMap.get(cat.id) ?? [];
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(cat.id);
  const count = countProductsInCategory(products, categories, cat.id);
  const isActive = selectedId === cat.id;

  return (
    <div className="catalog-tree-node">
      <div
        className={`catalog-tree-row ${isActive ? "catalog-tree-row--active" : ""}`}
        style={{ paddingInlineStart: `${0.65 + depth * 1.1}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="catalog-tree-toggle"
            onClick={() => onToggleExpand(cat.id)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} className="rtl:rotate-180" />}
          </button>
        ) : (
          <span className="catalog-tree-toggle catalog-tree-toggle--spacer" aria-hidden />
        )}
        <button type="button" className="catalog-tree-label" onClick={() => onSelect(cat.id)}>
          {expanded || isActive ? (
            <FolderOpen size={15} className="catalog-tree-icon" />
          ) : (
            <Folder size={15} className="catalog-tree-icon" />
          )}
          <span className="catalog-tree-name">{categoryLabel(cat, lang)}</span>
          <span className="catalog-tree-count">{count}</span>
        </button>
      </div>
      {hasChildren && expanded ? (
        <div className="catalog-tree-children">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              lang={lang}
              products={products}
              categories={categories}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CatalogCategoryTree({
  lang,
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  allLabel,
  allCount,
}) {
  const childrenMap = useMemo(() => buildChildrenMap(categories), [categories]);
  const roots = childrenMap.get(null) ?? [];
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (id) => {
    onSelectCategory(id);
    if (id != null) {
      setExpandedIds((prev) => new Set(prev).add(id));
    }
  };

  return (
    <nav className="catalog-category-tree" aria-label={allLabel}>
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`catalog-tree-row catalog-tree-row--root ${selectedCategoryId == null ? "catalog-tree-row--active" : ""}`}
      >
        <span className="catalog-tree-toggle catalog-tree-toggle--spacer" aria-hidden />
        <span className="catalog-tree-label catalog-tree-label--static">
          <span className="catalog-tree-name">{allLabel}</span>
          <span className="catalog-tree-count">{allCount}</span>
        </span>
      </button>
      {roots.map((cat) => (
        <CategoryNode
          key={cat.id}
          cat={cat}
          depth={0}
          lang={lang}
          products={products}
          categories={categories}
          selectedId={selectedCategoryId}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          onSelect={handleSelect}
        />
      ))}
    </nav>
  );
}
