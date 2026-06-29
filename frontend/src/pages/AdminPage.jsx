import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Package,
  Inbox,
  FileSpreadsheet,
  LayoutTemplate,
  Layers,
  Archive,
  Globe,
} from "lucide-react";
import { ADMIN_KEY_STORAGE } from "../constants/catalog.js";
import { getInquiries } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { ADMIN_TABS, adminLabel, ADMIN_SHELL } from "../constants/adminLabels.js";
import SeoHead from "../components/SeoHead.jsx";
import SiteContentManagement from "../components/admin/SiteContentManagement.jsx";
import CatalogManager from "../components/admin/CatalogManager.jsx";
import QuotesInbox from "../components/admin/QuotesInbox.jsx";
import QuoteTemplates from "../components/admin/QuoteTemplates.jsx";
import FreeFormQuoteGenerator from "../components/admin/FreeFormQuoteGenerator.jsx";
import ArchivedOffersWorkspace from "../components/admin/ArchivedOffersWorkspace.jsx";
import { AuthGateSkeleton } from "../components/admin/Skeleton.jsx";

const NAV_ITEMS = [
  { path: "site-content", icon: LayoutTemplate },
  { path: "products", icon: Package },
  { path: "quotes", icon: Inbox },
  { path: "templates", icon: Layers },
  { path: "offers", icon: FileSpreadsheet },
  { path: "archive", icon: Archive },
];

export default function AdminPage() {
  const { lang, toggle } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  const shell = ADMIN_SHELL[lang];

  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) {
      setAuthChecking(false);
      return undefined;
    }

    getInquiries(stored)
      .then(() => {
        if (cancelled) return;
        setAdminKey(stored);
        setAuthenticated(true);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(ADMIN_KEY_STORAGE);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    setAuthError("");
    try {
      await getInquiries(inputKey.trim());
      localStorage.setItem(ADMIN_KEY_STORAGE, inputKey.trim());
      setAdminKey(inputKey.trim());
      setAuthenticated(true);
      const returnTo =
        location.pathname.startsWith("/admin/") && location.pathname !== "/admin"
          ? location.pathname
          : "/admin/site-content";
      navigate(returnTo, { replace: true });
    } catch {
      setAuthError(shell.loginError);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
    setAuthenticated(false);
    setInputKey("");
    navigate("/admin", { replace: true });
  };

  if (authChecking) {
    return (
      <>
        <SeoHead title="Admin | Egy Mac" description="" path="/admin" noindex />
        <AuthGateSkeleton />
      </>
    );
  }

  if (!authenticated) {
    return (
      <>
        <SeoHead title="Admin Login | Egy Mac" description="" path="/admin" noindex />
        <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 py-12">
        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 sm:p-10 w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#e9f3f4] text-[#3b767c] shrink-0">
              <Lock size={20} />
            </span>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight">{shell.loginTitle}</h1>
              <p className="text-[11px] font-semibold text-[#3b767c] uppercase tracking-[0.14em]">
                {shell.subtitle}
              </p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-5 leading-relaxed">{shell.loginHint}</p>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder={shell.loginPlaceholder}
            className="input-field mb-4"
            autoComplete="off"
          />
          {authError ? (
            <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">
              {authError}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full">
            {shell.loginButton}
          </button>
        </form>
        </div>
      </>
    );
  }

  const activePath = location.pathname.replace(/^\/admin\/?/, "") || "site-content";

  return (
    <>
      <SeoHead title="Admin | Egy Mac" description="" path={location.pathname} noindex />
      <div className="min-h-screen pb-16 bg-slate-50 admin-print-root">
      <div className="section-container py-10">
        <div className="admin-print-chrome flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="section-label">Egy Mac</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{shell.dashboard}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:border-[#3b767c]/50 hover:text-[#3b767c] hover:bg-[#e9f3f4]/50 transition-all"
            >
              <Globe size={14} />
              {lang === "en" ? "AR" : "EN"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium px-3.5 py-2 rounded-lg transition-all duration-200"
            >
              {shell.logout}
            </button>
          </div>
        </div>

        <nav
          className="admin-print-chrome flex flex-wrap gap-1.5 mb-8 p-1.5 rounded-2xl border border-slate-200 bg-white shadow-sm w-fit max-w-full"
          aria-label="Admin workspace"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(`/admin/${item.path}`)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out active:scale-95 ${
                  isActive
                    ? "bg-[#3b767c] text-white shadow-md"
                    : "text-slate-600 hover:bg-[#e9f3f4]/60 hover:text-[#3b767c]"
                }`}
              >
                <item.icon size={16} aria-hidden="true" />
                {adminLabel(item.path, lang)}
              </button>
            );
          })}
        </nav>

        <Routes>
          <Route index element={<Navigate to="site-content" replace />} />
          <Route path="site-content" element={<SiteContentManagement adminKey={adminKey} />} />
          <Route
            path="products"
            element={
              <div className="admin-tab-panel bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                <CatalogManager adminKey={adminKey} />
              </div>
            }
          />
          <Route
            path="quotes"
            element={
              <div className="admin-tab-panel bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                <QuotesInbox adminKey={adminKey} />
              </div>
            }
          />
          <Route
            path="templates"
            element={
              <div className="admin-tab-panel bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                <QuoteTemplates adminKey={adminKey} />
              </div>
            }
          />
          <Route path="offers" element={<FreeFormQuoteGenerator adminKey={adminKey} />} />
          <Route
            path="archive"
            element={
              <div className="admin-tab-panel bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                <ArchivedOffersWorkspace
                  adminKey={adminKey}
                  onEditOffer={(id) => navigate("/admin/offers", { state: { editQuoteId: id } })}
                />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="site-content" replace />} />
        </Routes>
      </div>
    </div>
    </>
  );
}
