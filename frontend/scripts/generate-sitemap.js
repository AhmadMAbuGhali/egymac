#!/usr/bin/env node
/**
 * Generates public/sitemap.xml at build time from bundled catalog data.
 * Ensures crawlers get a sitemap without relying on server rewrites.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "backend", "data");
const OUT = path.join(__dirname, "..", "public", "sitemap.xml");

const SITE_URL = (process.env.VITE_SITE_URL || "https://www.egymac.net").replace(/\/$/, "");

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(loc, { changefreq = "weekly", priority = "0.7" } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return `<url><loc>${xmlEscape(loc)}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

async function readJson(name) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, name), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function main() {
  const [products, categories] = await Promise.all([
    readJson("products.json"),
    readJson("categories.json"),
  ]);

  const urls = [
    urlEntry(`${SITE_URL}/`, { changefreq: "weekly", priority: "1.0" }),
    urlEntry(`${SITE_URL}/catalog`, { changefreq: "daily", priority: "0.9" }),
  ];

  for (const product of products) {
    if (product?.id == null) continue;
    urls.push(
      urlEntry(`${SITE_URL}/catalog?product=${encodeURIComponent(product.id)}`, {
        changefreq: "weekly",
        priority: "0.8",
      })
    );
  }

  for (const cat of categories) {
    if (cat?.id == null) continue;
    urls.push(
      urlEntry(`${SITE_URL}/catalog?category=${encodeURIComponent(cat.id)}`, {
        changefreq: "weekly",
        priority: "0.6",
      })
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, xml, "utf-8");
  console.log(`[sitemap] Wrote ${urls.length} URLs → ${OUT}`);
}

main().catch((err) => {
  console.error("[sitemap] Failed:", err.message);
  process.exit(1);
});
