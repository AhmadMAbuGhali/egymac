import { Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ContactActionButtons from "./components/ContactActionButtons.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import PageTransition from "./components/PageTransition.jsx";
import HomePage from "./pages/HomePage.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import { SiteContentProvider } from "./context/SiteContentContext.jsx";

const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");

  const shell = (
    <div className="min-h-screen flex flex-col bg-surface">
      <ScrollToTop />
      {!isAdminRoute && <Header />}
      <main className="flex-1">
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminPage />
                </Suspense>
              }
            />
          </Routes>
        </PageTransition>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ContactActionButtons />}
    </div>
  );

  if (isAdminRoute) return shell;
  return <SiteContentProvider>{shell}</SiteContentProvider>;
}
