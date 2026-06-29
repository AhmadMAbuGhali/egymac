import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
} from "../constants/seo.js";
import { PRIMARY_PHONE, WEBSITE } from "../constants/contact.js";

export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "إيجي ماك",
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
      "Industrial molds",
      "Mechanical overhauling",
      "Heavy machinery engineering",
    ],
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

export function buildHomeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationSchema(), buildWebSiteSchema()],
  };
}

export function buildCatalogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Egy Mac Industrial Product Catalog",
    url: absoluteUrl("/catalog"),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
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

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description?.slice(0, 500),
    image: image?.startsWith("http") ? image : image ? absoluteUrl(image) : absoluteUrl("/logo.png"),
    url: absoluteUrl(`/catalog?product=${product.id}`),
    brand: { "@type": "Brand", name: SITE_NAME },
    manufacturer: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "EGP",
      url: absoluteUrl(`/catalog?product=${product.id}`),
    },
  };
}
