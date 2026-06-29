import { useEffect } from "react";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
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

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"][${MANAGED_ATTR}]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute(MANAGED_ATTR, "true");
    el.setAttribute("rel", rel);
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

    document.title = pageTitle;

    upsertMeta(`meta[name="description"]`, { name: "description", content: pageDescription });
    if (keywords) {
      upsertMeta(`meta[name="keywords"]`, { name: "keywords", content: keywords });
    }
    upsertMeta(`meta[name="robots"]`, {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    });
    upsertMeta(`meta[property="og:type"]`, { property: "og:type", content: "website" });
    upsertMeta(`meta[property="og:site_name"]`, { property: "og:site_name", content: SITE_NAME });
    upsertMeta(`meta[property="og:title"]`, { property: "og:title", content: pageTitle });
    upsertMeta(`meta[property="og:description"]`, {
      property: "og:description",
      content: pageDescription,
    });
    upsertMeta(`meta[property="og:url"]`, { property: "og:url", content: canonical });
    upsertMeta(`meta[property="og:image"]`, { property: "og:image", content: absoluteUrl(image) });
    upsertMeta(`meta[property="og:locale"]`, {
      property: "og:locale",
      content: lang === "ar" ? "ar_EG" : "en_US",
    });
    upsertMeta(`meta[name="twitter:card"]`, { name: "twitter:card", content: "summary_large_image" });
    upsertMeta(`meta[name="twitter:title"]`, { name: "twitter:title", content: pageTitle });
    upsertMeta(`meta[name="twitter:description"]`, {
      name: "twitter:description",
      content: pageDescription,
    });
    upsertMeta(`meta[name="twitter:image"]`, { name: "twitter:image", content: absoluteUrl(image) });

    upsertLink("canonical", canonical);
    upsertJsonLd("seo-json-ld", jsonLd);
  }, [title, description, path, image, noindex, lang, keywords, jsonLd]);

  return null;
}
