import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  FAQ_ITEMS,
} from "../constants/seo.js";
import { PRIMARY_PHONE, WEBSITE } from "../constants/contact.js";

export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["إيجي ماك", "Egy Mac"],
    url: SITE_URL,
    logo: absoluteUrl("/logo.png"),
    image: absoluteUrl("/logo.png"),
    telephone: PRIMARY_PHONE,
    email: "info@egymac.net",
    sameAs: [`https://${WEBSITE.replace(/^https?:\/\//, "")}`],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cairo",
      addressCountry: "EG",
    },
    areaServed: { "@type": "Country", name: "Egypt" },
    knowsAbout: [
      "Concrete block production lines",
      "Hollow block molds",
      "Interlock molds",
      "Industrial molds",
      "Mechanical overhauling",
      "Heavy machinery engineering",
    ],
  };
}

export function buildLocalBusinessSchema() {
  return {
    "@type": ["LocalBusiness", "Manufacturer"],
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    alternateName: "إيجي ماك",
    url: SITE_URL,
    image: absoluteUrl("/logo.png"),
    logo: absoluteUrl("/logo.png"),
    telephone: PRIMARY_PHONE,
    email: "info@egymac.net",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cairo",
      addressCountry: "EG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 30.0444,
      longitude: 31.2357,
    },
    areaServed: { "@type": "Country", name: "Egypt" },
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
  };
}

export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["en", "ar"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/catalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildFaqSchema(lang = "en") {
  const faqs = FAQ_ITEMS[lang] || FAQ_ITEMS.en;
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function buildHomeSchema(lang = "en") {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildLocalBusinessSchema(),
      buildWebSiteSchema(),
      buildFaqSchema(lang),
    ],
  };
}

export function buildBreadcrumbSchema(items) {
  if (!items?.length) return null;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildCatalogSchema(products = [], lang = "en") {
  const graph = [
    {
      "@type": "CollectionPage",
      name: lang === "ar" ? "فهرس منتجات إيجي ماك" : "Egy Mac Industrial Product Catalog",
      url: absoluteUrl("/catalog"),
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
    },
    buildBreadcrumbSchema([
      { name: lang === "ar" ? "الرئيسية" : "Home", path: "/" },
      { name: lang === "ar" ? "الكتالوج" : "Catalog", path: "/catalog" },
    ]),
  ];

  if (products.length) {
    graph.push({
      "@type": "ItemList",
      name: lang === "ar" ? "منتجات إيجي ماك" : "Egy Mac Products",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/catalog?product=${p.id}`),
        name: lang === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function buildProductSchema(product, lang = "en") {
  if (!product) return null;
  const name =
    lang === "ar"
      ? product.nameAr || product.titleAr || product.nameEn
      : product.nameEn || product.title || product.nameAr;
  const description =
    lang === "ar"
      ? product.descriptionAr || product.descriptionEn
      : product.descriptionEn || product.descriptionAr;
  const image = Array.isArray(product.images) ? product.images[0] : product.image;
  const imageUrl = image?.startsWith("http") ? image : image ? absoluteUrl(image) : absoluteUrl("/logo.png");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name,
        description: description?.slice(0, 500),
        image: imageUrl,
        url: absoluteUrl(`/catalog?product=${product.id}`),
        sku: `EGYMAC-${product.id}`,
        brand: { "@type": "Brand", name: SITE_NAME },
        manufacturer: { "@id": `${SITE_URL}/#organization` },
        category: lang === "ar" ? "معدات خرسانة وقوالب صناعية" : "Concrete block machinery & molds",
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "EGP",
          url: absoluteUrl(`/catalog?product=${product.id}`),
        },
      },
      buildBreadcrumbSchema([
        { name: lang === "ar" ? "الرئيسية" : "Home", path: "/" },
        { name: lang === "ar" ? "الكتالوج" : "Catalog", path: "/catalog" },
        { name, path: `/catalog?product=${product.id}` },
      ]),
    ],
  };
}
