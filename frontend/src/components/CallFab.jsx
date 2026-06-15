import { PhoneCall } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { formatPhoneDisplay } from "../utils/siteContent.js";

export default function CallFab() {
  const { lang } = useLanguage();
  const { content } = useSiteContent();
  const phone = content?.contact?.phone || "";
  const phoneDisplay = formatPhoneDisplay(phone);

  if (!phone) return null;

  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="call-fab group"
      aria-label={lang === "en" ? `Call Egy Mac at ${phoneDisplay}` : `اتصل بإيجي ماك ${phoneDisplay}`}
      title={phoneDisplay}
    >
      <span className="call-fab-pulse" aria-hidden />
      <span className="call-fab-ring" aria-hidden />
      <PhoneCall size={22} strokeWidth={2.25} className="relative z-10" />
      <span className="call-fab-label hidden sm:inline">
        {lang === "en" ? "Call Us" : "اتصل بنا"}
      </span>
    </a>
  );
}
