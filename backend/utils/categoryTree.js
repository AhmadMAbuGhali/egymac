/** Category tree helpers — nesting, cycle detection, hierarchical labels */

export function buildChildrenMap(categories) {
  const map = new Map();
  for (const cat of categories) {
    const pid = cat.parentId ?? null;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid).push(cat);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.nameEn || "").localeCompare(b.nameEn || ""));
  }
  return map;
}

export function getDescendantIds(categories, categoryId) {
  const childrenMap = buildChildrenMap(categories);
  const result = new Set();
  const walk = (id) => {
    for (const child of childrenMap.get(id) || []) {
      result.add(child.id);
      walk(child.id);
    }
  };
  walk(categoryId);
  return result;
}

export function wouldCreateCycle(categories, categoryId, newParentId) {
  if (newParentId == null) return false;
  if (Number(newParentId) === Number(categoryId)) return true;
  const descendants = getDescendantIds(categories, categoryId);
  return descendants.has(Number(newParentId));
}

/** Flat list with breadcrumb path for dropdowns */
export function flattenWithPaths(categories, lang = "en") {
  const childrenMap = buildChildrenMap(categories);
  const rows = [];

  const walk = (parentId, prefix) => {
    for (const cat of childrenMap.get(parentId) ?? []) {
      const label =
        lang === "ar"
          ? cat.nameAr || cat.nameEn || `#${cat.id}`
          : cat.nameEn || cat.nameAr || `#${cat.id}`;
      const path = prefix ? `${prefix} › ${label}` : label;
      rows.push({ ...cat, path, depth: prefix ? prefix.split(" › ").length : 0 });
      walk(cat.id, path);
    }
  };

  walk(null, "");
  return rows;
}

export function findCategory(categories, id) {
  return categories.find((c) => Number(c.id) === Number(id)) || null;
}
