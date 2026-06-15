import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSiteContent } from "../api/client.js";

const SiteContentContext = createContext({
  content: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    return getSiteContent()
      .then((r) => setContent(r.data ?? null))
      .catch((e) => setError(e.message || "Failed to load site content."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo(
    () => ({ content, loading, error, reload: load }),
    [content, loading, error]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
