import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "assets", "fonts");

/** Prefer cairo-*.woff2 naming; accept legacy Cairo-*.woff2 */
const FONT_SPECS = [
  { weight: 400, candidates: ["cairo-regular.woff2", "Cairo-Regular.woff2"] },
  { weight: 600, candidates: ["cairo-semibold.woff2", "Cairo-SemiBold.woff2"] },
  { weight: 700, candidates: ["cairo-bold.woff2", "Cairo-Bold.woff2"] },
];

let cachedCss = null;
let cachedLocal = null;

function resolveFontPath(candidates) {
  for (const name of candidates) {
    const abs = path.join(FONTS_DIR, name);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function fileUrlForFont(absPath) {
  return pathToFileURL(absPath).href.replace(/\\/g, "/");
}

function readFontBase64(absPath) {
  return fs.readFileSync(absPath).toString("base64");
}

/**
 * Offline-first Cairo @font-face — absolute file:// URLs, then inline base64 fallback.
 * Google Fonts @import only when no local files exist.
 */
export function getEmbeddedCairoFontCss() {
  if (cachedCss) return cachedCss;

  const resolved = FONT_SPECS.map(({ weight, candidates }) => {
    const abs = resolveFontPath(candidates);
    return abs ? { weight, abs } : null;
  });

  const allLocal = resolved.every(Boolean);

  if (allLocal) {
    const faces = resolved.map(({ weight, abs }) => {
      const fileUrl = fileUrlForFont(abs);
      return `@font-face {
  font-family: "Cairo";
  font-style: normal;
  font-weight: ${weight};
  font-display: block;
  src: url("${fileUrl}") format("woff2"),
       url("data:font/woff2;base64,${readFontBase64(abs)}") format("woff2");
}`;
    });
    cachedLocal = true;
    cachedCss = `${faces.join("\n")}
html, body, .offer-document, .replica-print-wrapper, #replica-print-area {
  font-family: "Cairo", sans-serif !important;
}`;
    return cachedCss;
  }

  const partial = resolved.filter(Boolean);
  if (partial.length > 0) {
    const faces = partial.map(({ weight, abs }) => {
      const fileUrl = fileUrlForFont(abs);
      return `@font-face {
  font-family: "Cairo";
  font-style: normal;
  font-weight: ${weight};
  font-display: block;
  src: url("${fileUrl}") format("woff2");
}`;
    });
    cachedLocal = true;
    cachedCss = `${faces.join("\n")}
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
html, body { font-family: "Cairo", sans-serif; }`;
    return cachedCss;
  }

  cachedLocal = false;
  cachedCss = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
html, body { font-family: "Cairo", sans-serif; }`;
  return cachedCss;
}

export function usesLocalCairoFonts() {
  if (cachedLocal != null) return cachedLocal;
  getEmbeddedCairoFontCss();
  return cachedLocal === true;
}

/** Puppeteer font-ready wait — short when local files resolve, longer for network fallback */
export function getFontLoadWaitMs() {
  return usesLocalCairoFonts()
    ? Number(process.env.PDF_FONT_WAIT_LOCAL_MS) || 2500
    : Number(process.env.PDF_FONT_WAIT_NETWORK_MS) || 10000;
}

export { FONTS_DIR };
