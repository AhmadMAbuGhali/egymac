import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { siteText } from "../utils/siteContent.js";
import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";
import HomePageSkeleton from "../components/HomePageSkeleton.jsx";
import RevealWrapper from "../components/RevealWrapper.jsx";
import SeoHead from "../components/SeoHead.jsx";
import FaqSection from "../components/FaqSection.jsx";
import {
  DEFAULT_TITLE,
  DEFAULT_TITLE_AR,
  DEFAULT_DESCRIPTION,
  DEFAULT_DESCRIPTION_AR,
  pageKeywords,
} from "../constants/seo.js";
import { buildHomeSchema } from "../utils/seoSchema.js";

export default function HomePage() {
  const { lang } = useLanguage();
  const { content, loading, error } = useSiteContent();

  const heroTitle = siteText(content?.hero?.title, lang);
  const seoTitle =
    heroTitle && heroTitle.length < 70
      ? `${heroTitle} | Egy Mac`
      : lang === "ar"
        ? DEFAULT_TITLE_AR
        : DEFAULT_TITLE;
  const seoDescription =
    siteText(content?.hero?.subtitle, lang) ||
    (lang === "ar" ? DEFAULT_DESCRIPTION_AR : DEFAULT_DESCRIPTION);

  if (loading) {
    return (
      <>
        <SeoHead
          title={seoTitle}
          description={seoDescription}
          path="/"
          lang={lang}
          jsonLd={buildHomeSchema(lang)}
        />
        <HomePageSkeleton />
      </>
    );
  }

  if (error && !content) {
    return (
      <>
        <SeoHead title={seoTitle} description={seoDescription} path="/" lang={lang} />
        <div className="section-container py-24 text-center">
          <p className="text-ink-body">{error}</p>
        </div>
      </>
    );
  }

  const teaser = content?.catalogTeaser;

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        path="/"
        lang={lang}
        keywords={pageKeywords(lang)}
        jsonLd={buildHomeSchema(lang)}
      />
      <Hero />
      <About />

      <section className="py-16 bg-surface-muted border-t border-border">
        <div className="section-container text-center">
          <RevealWrapper>
            {siteText(teaser?.label, lang) ? (
              <p className="section-label">{siteText(teaser?.label, lang)}</p>
            ) : null}
            {siteText(teaser?.heading, lang) ? (
              <h2 className="section-heading mt-3 mb-6">{siteText(teaser?.heading, lang)}</h2>
            ) : null}
            <Link to="/catalog" className="btn-primary inline-flex">
              {siteText(teaser?.ctaText, lang) || (lang === "en" ? "Explore Service Catalog" : "استكشف فهرس الخدمات")}
              <ArrowRight size={18} />
            </Link>
          </RevealWrapper>
        </div>
      </section>
      <FaqSection lang={lang} />
    </>
  );
}
