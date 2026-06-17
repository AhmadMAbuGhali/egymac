import { PhoneCall, MessageCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { formatPhoneDisplay } from "../utils/siteContent.js";

const WHATSAPP_PREFILL = {
  en: "Hello Egy Mac, I would like to inquire about your services.",
  ar: "مرحباً إيجي ماك، أود الاستفسار عن خدماتكم.",
};

function whatsappUrl(phone, lang = "en") {
  const digits = String(phone || "").replace(/\D/g, "");
  const text = WHATSAPP_PREFILL[lang] || WHATSAPP_PREFILL.en;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function ContactActionButtons() {
  const { lang } = useLanguage();
  const { content } = useSiteContent();
  const phone = content?.contact?.phone || "";
  const phoneDisplay = formatPhoneDisplay(phone);

  if (!phone) return null;

  return (
    <div className="contact-dock" aria-label={lang === "en" ? "Contact options" : "خيارات التواصل"}>
      <a
        href={whatsappUrl(phone, lang)}
        target="_blank"
        rel="noopener noreferrer"
        className="contact-dock__btn contact-dock__btn--whatsapp"
        title={lang === "en" ? "WhatsApp" : "واتساب"}
        aria-label={lang === "en" ? "WhatsApp" : "واتساب"}
      >
        <MessageCircle size={20} strokeWidth={2.25} />
      </a>
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        className="contact-dock__btn contact-dock__btn--call"
        title={phoneDisplay}
        aria-label={lang === "en" ? `Call ${phoneDisplay}` : `اتصل ${phoneDisplay}`}
      >
        <PhoneCall size={20} strokeWidth={2.25} />
      </a>
    </div>
  );
}
