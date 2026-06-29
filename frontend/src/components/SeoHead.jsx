import { useEffect } from "react";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  GEO,
  GOOGLE_SITE_VERIFICATION,
} from "../constants/seo.js";

const MANAGED_ATTR = "data-seo-managed";

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(`${selector}[${MANAGED_ATTR}]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(MANAGED_ATTR, "true");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === "") {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  });
}

function upsertLink(rel, href, extra = {}) {
  const hreflang = extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ":not([hreflang])";
  let el = document.head.querySelector(`link[rel="${rel}"]${hreflang}[${MANAGED_ATTR}]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute(MANAGED_ATTR, "true");
    el.setAttribute("rel", rel);
    if (extra.hreflang) el.setAttribute("hreflang", extra.hreflang);
    document.head.appendChild(el);
  }
  if (href) el.setAttribute("href", href);
  else el.remove();
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Client-side SEO head manager for SPA routes.
 */
export default function SeoHead({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  lang = "en",
  keywords = "",
  jsonLd = null,
}) {
  useEffect(() => {
    const canonical = absoluteUrl(path);
    const pageTitle = title || SITE_NAME;
    const pageDescription = description || "";
    const ogImage = absoluteUrl(image);

    document.title = pageTitle;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    upsertMeta(`meta[name="description"]`, { name: "description", content: pageDescription });
    if (keywords) {
      upsertMeta(`meta[name="keywords"]`, { name: "keywords", content: keywords });
    }
    upsertMeta(`meta[name="robots"]`, {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
    upsertMeta(`meta[name="author"]`, { name: "author", content: SITE_NAME });
    upsertMeta(`meta[name="geo.region"]`, { name: "geo.region", content: GEO.region });
    upsertMeta(`meta[name="geo.placename"]`, { name: "geo.placename", content: GEO.placename });
    upsertMeta(`meta[name="geo.position"]`, { name: "geo.position", content: GEO.position });
    upsertMeta(`meta[name="ICBM"]`, { name: "ICBM", content: GEO.icbm });

    if (GOOGLE_SITE_VERIFICATION) {
      upsertMeta(`meta[name="google-site-verification"]`, {
        name: "google-site-verification",
        content: GOOGLE_SITE_VERIFICATION,
      });
    }

    upsertMeta(`meta[property="og:type"]`, { property: "og:type", content: "website" });
    upsertMeta(`meta[property="og:site_name"]`, { property: "og:site_name", content: SITE_NAME });
    upsertMeta(`meta[property="og:title"]`, { property: "og:title", content: pageTitle });
    upsertMeta(`meta[property="og:description"]`, {
      property: "og:description",
      content: pageDescription,
    });
    upsertMeta(`meta[property="og:url"]`, { property: "og:url", content: canonical });
    upsertMeta(`meta[property="og:image"]`, { property: "og:image", content: ogImage });
    upsertMeta(`meta[property="og:image:alt"]`, {
      property: "og:image:alt",
      content: `${SITE_NAME} — industrial machinery Egypt`,
    });
    upsertMeta(`meta[property="og:locale"]`, {
      property: "og:locale",
      content: lang === "ar" ? "ar_EG" : "en_US",
    });
    upsertMeta(`meta[property="og:locale:alternate"]`, {
      property: "og:locale:alternate",
      content: lang === "ar" ? "en_US" : "ar_EG",
    });

    upsertMeta(`meta[name="twitter:card"]`, { name: "twitter:card", content: "summary_large_image" });
    upsertMeta(`meta[name="twitter:title"]`, { name: "twitter:title", content: pageTitle });
    upsertMeta(`meta[name="twitter:description"]`, {
      name: "twitter:description",
      content: pageDescription,
    });
    upsertMeta(`meta[name="twitter:image"]`, { name: "twitter:image", content: ogImage });

    upsertLink("canonical", canonical);
    upsertLink("alternate", canonical, { hreflang: "en" });
    upsertLink("alternate", canonical, { hreflang: "ar" });
    upsertLink("alternate", canonical, { hreflang: "x-default" });

    upsertJsonLd("seo-json-ld", jsonLd);
  }, [title, description, path, image, noindex, lang, keywords, jsonLd]);

  return null;
}
