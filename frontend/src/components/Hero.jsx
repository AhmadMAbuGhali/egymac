import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { siteText } from "../utils/siteContent.js";
import RevealWrapper from "./RevealWrapper.jsx";

export default function Hero() {
  const { lang } = useLanguage();
  const { content } = useSiteContent();
  const hero = content?.hero;

  const title = siteText(hero?.title, lang);
  const subtitle = siteText(hero?.subtitle, lang);
  const badge = siteText(hero?.badgeText, lang);
  const cta = siteText(hero?.ctaText, lang);
  const bgImage = hero?.backgroundImage?.trim();

  const sectionStyle = bgImage
    ? {
        backgroundImage: `linear-gradient(rgb(255 255 255 / 0.92), rgb(248 250 252 / 0.95)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden pt-20 bg-surface"
      style={sectionStyle}
    >
      <div className="absolute inset-0 bg-tech-grid bg-tech-grid" />
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface to-surface-muted pointer-events-none opacity-90" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent-light to-transparent pointer-events-none opacity-80" />

      <div className="section-container relative z-10 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <RevealWrapper>
            {badge ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-light border border-accent/30 text-accent-hover text-xs font-semibold uppercase tracking-wide mb-6">
                {badge}
              </div>
            ) : null}

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3rem] font-bold text-ink leading-[1.12] tracking-tight">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-6 text-lg text-ink-body leading-relaxed max-w-xl">{subtitle}</p>
            ) : null}

            {cta ? (
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/catalog" className="btn-primary">
                  {cta}
                  <ArrowRight size={18} />
                </Link>
              </div>
            ) : null}
          </RevealWrapper>

          <RevealWrapper delay={120} className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="card p-10 w-80 h-80 flex items-center justify-center border-border bg-surface overflow-hidden">
                <img
                  src={bgImage || "/logo.png"}
                  alt="Egy Mac Machine"
                  className="w-full max-w-[220px] object-contain"
                />
              </div>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
