/** Category tree utilities for admin UI */

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

export function flattenWithPaths(categories, lang = "en") {
  const childrenMap = buildChildrenMap(categories);
  const rows = [];

  const walk = (parentId, prefixEn, prefixAr) => {
    for (const cat of childrenMap.get(parentId) ?? []) {
      const labelEn = cat.nameEn || cat.nameAr || `#${cat.id}`;
      const labelAr = cat.nameAr || cat.nameEn || `#${cat.id}`;
      const pathEn = prefixEn ? `${prefixEn} › ${labelEn}` : labelEn;
      const pathAr = prefixAr ? `${prefixAr} › ${labelAr}` : labelAr;
      rows.push({
        ...cat,
        pathEn,
        pathAr,
        path: lang === "ar" ? pathAr : pathEn,
        depth: prefixEn ? prefixEn.split(" › ").length : 0,
      });
      walk(cat.id, pathEn, pathAr);
    }
  };

  walk(null, "", "");
  return rows;
}

export function buildNestedTreeRows(categories) {
  const childrenMap = buildChildrenMap(categories);
  const rows = [];

  const walk = (parentId, depth) => {
    for (const cat of childrenMap.get(parentId) ?? []) {
      rows.push({ ...cat, depth });
      walk(cat.id, depth + 1);
    }
  };

  walk(null, 0);
  return rows;
}

export function categoryLabel(cat, lang = "en") {
  if (!cat) return "";
  return lang === "ar" ? cat.nameAr || cat.nameEn : cat.nameEn || cat.nameAr;
}

export function findCategoryById(categories, id) {
  return categories.find((c) => Number(c.id) === Number(id)) || null;
}
