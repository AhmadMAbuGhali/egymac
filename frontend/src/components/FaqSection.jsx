import { FAQ_ITEMS } from "../constants/seo.js";
import RevealWrapper from "./RevealWrapper.jsx";

export default function FaqSection({ lang = "en" }) {
  const faqs = FAQ_ITEMS[lang] || FAQ_ITEMS.en;
  const L =
    lang === "ar"
      ? { title: "أسئلة شائعة", subtitle: "إجابات سريعة عن خطوط الإنتاج والقوالب والخدمات الهندسية" }
      : { title: "Frequently Asked Questions", subtitle: "Quick answers about production lines, molds & engineering services" };

  return (
    <section className="py-16 lg:py-20 bg-surface border-t border-border" aria-labelledby="faq-heading">
      <div className="section-container max-w-3xl">
        <RevealWrapper>
          <p className="section-label">{lang === "ar" ? "الدعم الفني" : "Technical FAQ"}</p>
          <h2 id="faq-heading" className="section-heading mt-2 mb-3">
            {L.title}
          </h2>
          <p className="text-ink-body mb-8 leading-relaxed">{L.subtitle}</p>
        </RevealWrapper>
        <dl className="space-y-4">
          {faqs.map(({ question, answer }) => (
            <RevealWrapper key={question}>
              <div className="card p-5 sm:p-6 border-border">
                <dt className="font-bold text-ink text-base sm:text-lg leading-snug">{question}</dt>
                <dd className="mt-2 text-ink-body text-sm sm:text-base leading-relaxed">{answer}</dd>
              </div>
            </RevealWrapper>
          ))}
        </dl>
      </div>
    </section>
  );
}
