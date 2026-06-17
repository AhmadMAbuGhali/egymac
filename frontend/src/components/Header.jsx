import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Globe, PhoneCall } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useSiteContent } from "../context/SiteContentContext.jsx";
import { formatPhoneDisplay } from "../utils/siteContent.js";

const NAV = [
  { type: "link", to: "/", label: { en: "Home", ar: "الرئيسية" } },
  { type: "hash", to: "/", hash: "about", label: { en: "About", ar: "من نحن" } },
  { type: "link", to: "/catalog", label: { en: "Catalog", ar: "الفهرس" } },
];

export default function Header() {
  const { lang, toggle } = useLanguage();
  const { content } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const phone = content?.contact?.phone || "";
  const phoneDisplay = formatPhoneDisplay(phone);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location]);

  const goTo = (item) => {
    setOpen(false);
    if (item.type === "hash") {
      if (location.pathname === "/") {
        document.getElementById(item.hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(`/#${item.hash}`);
      }
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "border-border/80 bg-surface/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          : "border-border/60 bg-surface"
      }`}
    >
      <div className="section-container flex items-center justify-between h-[4.25rem] lg:h-[5rem]">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="Egy Mac" className="h-12 lg:h-[3.75rem] w-auto max-w-[200px] object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) =>
            item.type === "hash" ? (
              <button key={item.label.en} onClick={() => goTo(item)} className="nav-link">
                {item.label[lang]}
              </button>
            ) : (
              <Link
                key={item.label.en}
                to={item.to}
                className={`nav-link ${location.pathname === item.to ? "nav-link-active" : ""}`}
              >
                {item.label[lang]}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-light border border-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-secondary hover:-translate-y-0.5 hover:shadow-accent active:scale-95 transition-all duration-200 ease-out"
            >
              <PhoneCall size={14} />
              <span dir="ltr" className="unicode-isolate phone-ltr" style={{ unicodeBidi: "isolate" }}>
                {phoneDisplay}
              </span>
            </a>
          ) : null}
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-ink-body text-xs font-bold hover:border-accent/50 hover:text-accent hover:bg-accent-light/50 active:scale-95 transition-all duration-200 ease-out"
          >
            <Globe size={14} />
            {lang === "en" ? "AR" : "EN"}
          </button>
          <button
            className="lg:hidden p-2 rounded-xl text-ink-body hover:text-accent hover:bg-accent-light/60 active:scale-95 transition-all duration-200"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/70 bg-surface/95 backdrop-blur-md shadow-soft-lg">
          <nav className="section-container py-4 flex flex-col gap-1">
            {NAV.map((item) =>
              item.type === "hash" ? (
                <button
                  key={item.label.en}
                  onClick={() => goTo(item)}
                  className="text-left px-4 py-3 text-sm font-medium text-ink-body hover:text-accent hover:bg-surface-muted rounded-lg"
                >
                  {item.label[lang]}
                </button>
              ) : (
                <Link
                  key={item.label.en}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-ink-body hover:text-accent hover:bg-surface-muted rounded-lg"
                >
                  {item.label[lang]}
                </Link>
              )
            )}
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="mx-4 mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-secondary text-sm font-semibold shadow-accent hover:bg-accent-hover transition-colors"
              >
                <PhoneCall size={16} />
                <span dir="ltr" className="phone-ltr" style={{ unicodeBidi: "isolate" }}>
                  {phoneDisplay}
                </span>
              </a>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
