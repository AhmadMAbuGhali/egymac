/** Heavy Machinery template (templateStyle: 'machinery_detailed') — data model */

export const MACHINERY_ORDINALS = [
  "أولاً",
  "ثانياً",
  "ثالثاً",
  "رابعاً",
  "خامساً",
  "سادساً",
  "سابعاً",
  "ثامناً",
  "تاسعاً",
  "عاشراً",
];

export function machineryOrdinal(index) {
  return MACHINERY_ORDINALS[index] || `${index + 1} -`;
}

export function createMachinerySpecRow(id, label = "", value = "") {
  return { id, label, value };
}

export function createMachineryItem(id) {
  return {
    id,
    title: "",
    image: null,
    imageCaption: "",
    specs: [
      createMachinerySpecRow(1, "Capacity", ""),
      createMachinerySpecRow(2, "Motor Power", ""),
      createMachinerySpecRow(3, "Main Body", ""),
    ],
    price: "",
    priceNote: "جنيه مصري — غير شامل الضريبة",
  };
}

/** Reference-modeled starter set (عرض سعر جزء خلفي) */
export function createMachinerySeed() {
  return [
    {
      ...createMachineryItem(1),
      title: "1250 DCM3 DOUBLE SHAFT MIXER (Main Mixer)",
      specs: [
        createMachinerySpecRow(1, "Capacity", "1250 DCM3"),
        createMachinerySpecRow(2, "Main Body Inner Linings", "ST 52 REINFORCED PRODUCTION"),
        createMachinerySpecRow(3, "Mixer Type", "Double shaft"),
        createMachinerySpecRow(4, "Motor Power", "30 Kw x 2"),
      ],
      price: "900,000",
    },
  ];
}

export function normalizeMachineryItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => ({
    ...createMachineryItem(item?.id ?? i + 1),
    ...item,
    title: String(item?.title ?? ""),
    image:
      typeof item?.image === "string" && item.image.startsWith("data:image/")
        ? item.image
        : null,
    imageCaption: String(item?.imageCaption ?? ""),
    price: String(item?.price ?? ""),
    priceNote: String(item?.priceNote ?? ""),
    specs: Array.isArray(item?.specs)
      ? item.specs.map((s, j) => ({
          ...createMachinerySpecRow(s?.id ?? j + 1),
          label: String(s?.label ?? ""),
          value: String(s?.value ?? ""),
        }))
      : [],
  }));
}
