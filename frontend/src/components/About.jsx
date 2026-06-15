import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { siteText, resolveFeatureIcon } from "../utils/siteContent.js";
import RevealWrapper from "./RevealWrapper.jsx";

export default function About() {
  const { lang } = useLanguage();
  const { content } = useSiteContent();
  const about = content?.about;
  const features = content?.features || [];

  const heading = siteText(about?.heading, lang);
  const description = siteText(about?.description, lang);
  const sectionImage = about?.sectionImage?.trim();

  return (
    <section id="about" className="py-20 lg:py-28 bg-surface-section border-y border-border">
      <div className="section-container">
        <div className="grid lg:grid-cols-[1fr_minmax(0,22rem)] gap-10 lg:gap-14 items-start mb-14">
          <RevealWrapper className="max-w-3xl">
            {heading ? <h2 className="section-heading">{heading}</h2> : null}
            {description ? (
              <p className="mt-5 text-ink-body text-lg leading-relaxed whitespace-pre-line">{description}</p>
            ) : null}
          </RevealWrapper>

          {sectionImage ? (
            <RevealWrapper delay={80}>
              <div className="card overflow-hidden border-border bg-surface">
                <img src={sectionImage} alt="" className="w-full h-auto object-cover min-h-[14rem]" />
              </div>
            </RevealWrapper>
          ) : null}
        </div>

        {features.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => {
              const Icon = resolveFeatureIcon(feature.icon);
              const title = siteText(feature.title, lang);
              const text = siteText(feature.description, lang);
              return (
                <RevealWrapper key={feature.id ?? i} delay={i * 70}>
                  <div className="card p-6 h-full bg-surface group hover:border-accent/40">
                    <div className="w-11 h-11 rounded-lg bg-accent-light flex items-center justify-center mb-4">
                      <Icon className="text-accent" size={22} />
                    </div>
                    {title ? <h3 className="font-semibold text-ink mb-2">{title}</h3> : null}
                    {text ? <p className="text-sm text-ink-body leading-relaxed">{text}</p> : null}
                  </div>
                </RevealWrapper>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
