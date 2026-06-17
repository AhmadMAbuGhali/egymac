import { useState } from "react";
import { Archive } from "lucide-react";
import ArchivedQuotesList from "./ArchivedQuotesList.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function ArchivedOffersWorkspace({ adminKey, onEditOffer }) {
  const { lang } = useLanguage();
  const [refreshToken, setRefreshToken] = useState(0);

  const L = {
    en: {
      title: "Offers Archive",
      subtitle: "Browse, edit, and manage all saved price offers.",
    },
    ar: {
      title: "أرشيف العروض",
      subtitle: "تصفح وعدّل جميع عروض الأسعار المحفوظة.",
    },
  }[lang];

  return (
    <div className="archive-workspace-root">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-[#3b767c] mb-2">
          <Archive size={22} />
          <h2 className="text-xl font-bold text-ink">{L.title}</h2>
        </div>
        <p className="text-sm font-semibold text-slate-700">{L.subtitle}</p>
      </header>
      <ArchivedQuotesList
        adminKey={adminKey}
        onEdit={onEditOffer}
        refreshToken={refreshToken}
      />
    </div>
  );
}
