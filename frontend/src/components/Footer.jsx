import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { siteText, formatPhoneDisplay } from "../utils/siteContent.js";

export default function Footer() {
  const { lang } = useLanguage();
  const { content } = useSiteContent();
  const contact = content?.contact;
  const year = new Date().getFullYear();

  const phone = contact?.phone || "";
  const phoneDisplay = formatPhoneDisplay(phone);
  const website = contact?.website || "";
  const address = siteText(contact?.address, lang);
  const facebookUrl = contact?.facebookUrl?.trim();

  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="section-container">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.4fr_auto] items-start">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Egy Mac" className="h-10 w-auto" />
            <div>
              <p className="text-ink font-semibold text-sm">Egy Mac Machine</p>
              <p className="text-xs text-ink-body">إيجي ماك · Industrial Engineering</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-ink-body leading-relaxed">
            <p className="text-ink font-semibold text-sm">
              {lang === "en" ? "Contact & Locations" : "التواصل والمواقع"}
            </p>
            {address ? (
              <p dir={lang === "ar" ? "rtl" : "ltr"} className={lang === "ar" ? "font-arabic text-ink-body whitespace-pre-line" : "whitespace-pre-line"}>
                {address}
              </p>
            ) : null}
            <p className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {website ? (
                <>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    className="text-accent hover:text-accent-hover font-semibold transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                  {(phone || facebookUrl) && <span className="text-border hidden sm:inline">|</span>}
                </>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="text-accent hover:text-accent-hover font-semibold transition-colors"
                >
                  {phoneDisplay}
                </a>
              ) : null}
              {facebookUrl ? (
                <>
                  <span className="text-border hidden sm:inline">|</span>
                  <a
                    href={facebookUrl}
                    className="text-accent hover:text-accent-hover font-semibold transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                </>
              ) : null}
            </p>
          </div>

          <div className="text-xs text-ink-muted lg:text-right">
            <p>
              {lang === "en"
                ? "Fully automated lines · Custom fabrication · Bespoke overhauling."
                : "خطوط آلية بالكامل · تصنيع من الصفر · صيانة وإعادة تصنيع هندسية."}
            </p>
            <p className="mt-4">© {year} Egy Mac</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
