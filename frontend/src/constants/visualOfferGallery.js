/**
 * Visual Offer Extension — static local gallery of pre-saved technical mockups.
 * Images are self-contained SVG data URIs (no network, no CORS) so they render
 * identically in the live preview, html2canvas captures, and backend Puppeteer PDFs.
 */

const BRAND = "#3b767c";
const BRAND_LIGHT = "#e9f3f4";
const INK = "#111827";

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s{2,}/g, " ").trim())}`;
}

/** Isometric solid block mold — قالب مصمت */
function solidMoldSvg(label) {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" font-family="Cairo, sans-serif">
    <rect width="320" height="200" fill="#ffffff"/>
    <rect x="8" y="8" width="304" height="184" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="2" rx="6"/>
    <g stroke="${BRAND}" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
      <polygon points="80,70 200,70 240,95 120,95"/>
      <polygon points="120,95 240,95 240,150 120,150"/>
      <polygon points="80,70 120,95 120,150 80,125"/>
    </g>
    <g stroke="${BRAND}" stroke-width="1.2" opacity="0.55">
      <line x1="150" y1="95" x2="150" y2="150"/>
      <line x1="180" y1="95" x2="180" y2="150"/>
      <line x1="210" y1="95" x2="210" y2="150"/>
    </g>
    <text x="160" y="40" text-anchor="middle" font-size="17" font-weight="700" fill="${INK}" direction="rtl">${label}</text>
    <text x="160" y="178" text-anchor="middle" font-size="11" font-weight="600" fill="${BRAND}">EGY MAC MACHINE — STEEL MOLD</text>
  </svg>`);
}

/** Interlock paving mold — قالب إنترلوك */
function interlockMoldSvg(label) {
  const stones = [
    [60, 88], [126, 88], [192, 88],
    [93, 122], [159, 122], [225, 122],
  ]
    .map(
      ([x, y]) =>
        `<path d="M${x} ${y} h40 l10 8 l-10 8 h-40 l-10 -8 z" fill="#ffffff" stroke="${BRAND}" stroke-width="2.2"/>`
    )
    .join("");
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" font-family="Cairo, sans-serif">
    <rect width="320" height="200" fill="#ffffff"/>
    <rect x="8" y="8" width="304" height="184" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="2" rx="6"/>
    <rect x="38" y="74" width="244" height="74" fill="none" stroke="${BRAND}" stroke-width="2.5" rx="3"/>
    ${stones}
    <text x="160" y="40" text-anchor="middle" font-size="17" font-weight="700" fill="${INK}" direction="rtl">${label}</text>
    <text x="160" y="178" text-anchor="middle" font-size="11" font-weight="600" fill="${BRAND}">EGY MAC MACHINE — INTERLOCK MOLD</text>
  </svg>`);
}

/** Hollow block mold — قالب بلوك مفرغ */
function hollowMoldSvg(label) {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" font-family="Cairo, sans-serif">
    <rect width="320" height="200" fill="#ffffff"/>
    <rect x="8" y="8" width="304" height="184" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="2" rx="6"/>
    <g stroke="${BRAND}" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
      <polygon points="80,70 200,70 240,95 120,95"/>
      <polygon points="120,95 240,95 240,150 120,150"/>
      <polygon points="80,70 120,95 120,150 80,125"/>
    </g>
    <g stroke="${BRAND}" stroke-width="2" fill="${BRAND_LIGHT}">
      <ellipse cx="125" cy="82" rx="11" ry="6"/>
      <ellipse cx="160" cy="82" rx="11" ry="6"/>
      <ellipse cx="195" cy="82" rx="11" ry="6"/>
    </g>
    <text x="160" y="40" text-anchor="middle" font-size="17" font-weight="700" fill="${INK}" direction="rtl">${label}</text>
    <text x="160" y="178" text-anchor="middle" font-size="11" font-weight="600" fill="${BRAND}">EGY MAC MACHINE — HOLLOW BLOCK MOLD</text>
  </svg>`);
}

/** Curbstone mold — قالب بردورة */
function curbstoneMoldSvg(label) {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" font-family="Cairo, sans-serif">
    <rect width="320" height="200" fill="#ffffff"/>
    <rect x="8" y="8" width="304" height="184" fill="${BRAND_LIGHT}" stroke="${BRAND}" stroke-width="2" rx="6"/>
    <g stroke="${BRAND}" stroke-width="2.5" fill="#ffffff" stroke-linejoin="round">
      <polygon points="60,100 220,100 250,118 90,118"/>
      <polygon points="90,118 250,118 250,152 90,152"/>
      <polygon points="60,100 90,118 90,152 60,134"/>
      <polygon points="60,100 220,100 220,84 76,84"/>
    </g>
    <text x="160" y="40" text-anchor="middle" font-size="17" font-weight="700" fill="${INK}" direction="rtl">${label}</text>
    <text x="160" y="178" text-anchor="middle" font-size="11" font-weight="600" fill="${BRAND}">EGY MAC MACHINE — CURBSTONE MOLD</text>
  </svg>`);
}

export const VISUAL_GALLERY_ITEMS = [
  {
    id: "solid-24",
    labelAr: "قالب مصمت 24",
    labelEn: "Solid Block Mold 24",
    src: solidMoldSvg("قالب مصمت 24"),
  },
  {
    id: "interlock",
    labelAr: "قالب إنترلوك",
    labelEn: "Interlock Mold",
    src: interlockMoldSvg("قالب إنترلوك"),
  },
  {
    id: "hollow-20",
    labelAr: "قالب بلوك مفرغ 20",
    labelEn: "Hollow Block Mold 20",
    src: hollowMoldSvg("قالب بلوك مفرغ 20"),
  },
  {
    id: "curbstone",
    labelAr: "قالب بردورة",
    labelEn: "Curbstone Mold",
    src: curbstoneMoldSvg("قالب بردورة"),
  },
];

/** Read a device file into a Base64 data URI via FileReader (CORS-free capture) */
export function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
