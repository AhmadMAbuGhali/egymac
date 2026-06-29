import { Router } from "express";
import { readJson } from "../utils/jsonStore.js";

const router = Router();

const SITE_URL = (process.env.SITE_URL || "https://www.egymac.net").replace(/\/$/, "");

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, { changefreq = "weekly", priority = "0.7", lastmod } = {}) {
  const lastmodTag = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
  return `<url><loc>${xmlEscape(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

/** GET /api/seo/sitemap.xml — dynamic sitemap for crawlers */
router.get("/sitemap.xml", async (_req, res) => {
  try {
    const [products, categories] = await Promise.all([
      readJson("products.json", []),
      readJson("categories.json", []),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const urls = [
      urlEntry(`${SITE_URL}/`, { changefreq: "weekly", priority: "1.0", lastmod: today }),
      urlEntry(`${SITE_URL}/catalog`, { changefreq: "daily", priority: "0.9", lastmod: today }),
    ];

    for (const product of products) {
      if (product?.id == null) continue;
      urls.push(
        urlEntry(`${SITE_URL}/catalog?product=${encodeURIComponent(product.id)}`, {
          changefreq: "weekly",
          priority: "0.8",
          lastmod: today,
        })
      );
    }

    for (const cat of categories) {
      if (cat?.id == null) continue;
      urls.push(
        urlEntry(`${SITE_URL}/catalog?category=${encodeURIComponent(cat.id)}`, {
          changefreq: "weekly",
          priority: "0.6",
          lastmod: today,
        })
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    res.send(xml);
  } catch (err) {
    res.status(500).type("text/plain").send(err.message);
  }
});

export default router;
