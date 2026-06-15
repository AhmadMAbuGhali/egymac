import { useState, useEffect, useCallback } from "react";
import { Lock, FileText, Package, Inbox, FileSpreadsheet, LayoutTemplate, Layers } from "lucide-react";
import { ADMIN_KEY_STORAGE } from "../constants/catalog.js";
import { getInquiries } from "../api/client.js";
import TextManager from "../components/admin/TextManager.jsx";
import SiteContentManagement from "../components/admin/SiteContentManagement.jsx";
import CatalogManager from "../components/admin/CatalogManager.jsx";
import QuotesInbox from "../components/admin/QuotesInbox.jsx";
import QuoteTemplates from "../components/admin/QuoteTemplates.jsx";
import FreeFormQuoteGenerator from "../components/admin/FreeFormQuoteGenerator.jsx";
import { AuthGateSkeleton } from "../components/admin/Skeleton.jsx";

const TABS = [
  { id: "site-content", label: "إدارة محتوى الموقع", icon: LayoutTemplate },
  { id: "texts", label: "Text Manager", icon: FileText },
  { id: "products", label: "Catalog CRUD", icon: Package },
  { id: "quotes", label: "Inquiries Inbox", icon: Inbox },
  { id: "templates", label: "قوالب العروض", icon: Layers },
  { id: "offers", label: "Price Offers", icon: FileSpreadsheet },
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [tab, setTab] = useState("site-content");
  const [authError, setAuthError] = useState("");

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
    } catch {
      setAuthError("Invalid admin key. Contact your system administrator.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
    setAuthenticated(false);
    setInputKey("");
  };

  if (authChecking) {
    return <AuthGateSkeleton />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-muted/50 bg-tech-grid py-12">
        <form
          onSubmit={handleLogin}
          className="bg-surface border border-border/70 rounded-2xl shadow-soft-lg p-8 sm:p-10 w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent-light text-accent shrink-0">
              <Lock size={20} />
            </span>
            <div>
              <h1 className="font-bold text-ink text-lg leading-tight">Admin Dashboard</h1>
              <p className="text-[11px] font-semibold text-accent uppercase tracking-[0.14em]">
                Egy Mac Control Center
              </p>
            </div>
          </div>
          <p className="text-ink-body text-sm mb-5 leading-relaxed">
            Enter your authorized admin API key to access the internal dashboard.
          </p>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Admin API Key"
            className="input-field mb-4"
            autoComplete="off"
          />
          {authError && (
            <p
              className="text-red-600 text-sm mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
              role="alert"
            >
              {authError}
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 bg-surface admin-print-root">
      <div className="section-container py-10">
        <div className="admin-print-chrome flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="section-label">Egy Mac</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">Admin Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-ink-muted hover:text-red-600 hover:bg-red-50 font-medium px-3.5 py-2 rounded-lg transition-all duration-200"
          >
            Logout
          </button>
        </div>

        <nav
          className="admin-print-chrome flex flex-wrap gap-1.5 mb-8 p-1.5 rounded-2xl border border-border/70 bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.03)] w-fit max-w-full"
          aria-label="Admin workspace tabs"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out active:scale-95 ${
                tab === t.id
                  ? "bg-accent text-secondary shadow-accent"
                  : "text-ink-body hover:bg-accent-light/60 hover:text-accent"
              }`}
            >
              <t.icon size={16} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "offers" ? (
          <div key="offers" className="admin-tab-panel">
            <FreeFormQuoteGenerator adminKey={adminKey} />
          </div>
        ) : tab === "site-content" ? (
          <div key="site-content" className="admin-tab-panel">
            <SiteContentManagement adminKey={adminKey} />
          </div>
        ) : (
          <div key={tab} className="admin-tab-panel bg-surface border border-border/70 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 lg:p-8">
            {tab === "texts" && <TextManager adminKey={adminKey} />}
            {tab === "products" && <CatalogManager adminKey={adminKey} />}
            {tab === "quotes" && <QuotesInbox adminKey={adminKey} />}
            {tab === "templates" && <QuoteTemplates adminKey={adminKey} />}
          </div>
        )}
      </div>
    </div>
  );
}
